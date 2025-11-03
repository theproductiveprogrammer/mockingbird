package store

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/fsnotify/fsnotify"
)

// Watcher watches for file changes in a directory
type Watcher struct {
	watcher  *fsnotify.Watcher
	callback func(string)
	done     chan bool
}

// NewWatcher creates a new file watcher
func NewWatcher(dir string, callback func(string)) (*Watcher, error) {
	fsWatcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, fmt.Errorf("failed to create watcher: %w", err)
	}

	w := &Watcher{
		watcher:  fsWatcher,
		callback: callback,
		done:     make(chan bool),
	}

	// Add directory to watcher
	if err := fsWatcher.Add(dir); err != nil {
		fsWatcher.Close()
		return nil, fmt.Errorf("failed to watch directory: %w", err)
	}

	// Start watching
	go w.watch()

	return w, nil
}

// watch processes file system events
func (w *Watcher) watch() {
	for {
		select {
		case event, ok := <-w.watcher.Events:
			if !ok {
				return
			}

			// Only care about write/create events on .yaml files
			if event.Op&fsnotify.Write == fsnotify.Write || event.Op&fsnotify.Create == fsnotify.Create {
				if filepath.Ext(event.Name) == ".yaml" {
					w.callback(event.Name)
				}
			}

		case err, ok := <-w.watcher.Errors:
			if !ok {
				return
			}
			if !strings.Contains(err.Error(), "no such file") {
				fmt.Printf("Watcher error: %v\n", err)
			}

		case <-w.done:
			return
		}
	}
}

// Close stops the watcher
func (w *Watcher) Close() error {
	close(w.done)
	return w.watcher.Close()
}

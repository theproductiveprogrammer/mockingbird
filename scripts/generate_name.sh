#!/usr/bin/env bash
#
# Generate a fun build name in the format: adjective_animal
# Example: raging_rhino, sulky_lizard, happy_panda
#

set -euo pipefail

# Arrays of adjectives
adjectives=(
    "raging"
    "sulky"
    "happy"
    "grumpy"
    "sleepy"
    "bouncy"
    "clever"
    "silly"
    "mighty"
    "gentle"
    "swift"
    "bold"
    "calm"
    "fierce"
    "jolly"
    "quirky"
    "zen"
    "wild"
    "wise"
    "zesty"
)

# Arrays of animals
animals=(
    "rhino"
    "lizard"
    "panda"
    "falcon"
    "otter"
    "penguin"
    "badger"
    "cobra"
    "dolphin"
    "eagle"
    "fox"
    "giraffe"
    "hawk"
    "jaguar"
    "koala"
    "lynx"
    "moose"
    "newt"
    "owl"
    "raven"
    "seal"
    "tiger"
    "viper"
    "whale"
    "zebra"
)

# Get array lengths
adj_count=${#adjectives[@]}
animal_count=${#animals[@]}

# Generate random indices using /dev/urandom
adj_index=$(($(od -An -N2 -tu2 /dev/urandom) % adj_count))
animal_index=$(($(od -An -N2 -tu2 /dev/urandom) % animal_count))

# Output the generated name
echo "${adjectives[$adj_index]}_${animals[$animal_index]}"

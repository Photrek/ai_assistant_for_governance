#!/bin/bash

json_dir="./rawJson"
problem_log="problematic_completions.log"

# Ensure jq is installed
if ! command -v jq &> /dev/null; then
    echo "jq is not installed. Please install jq to proceed."
    exit 1
fi

> "$problem_log"  # Clear the log file if it exists

for file in "$json_dir"/*.json; do
    if [ -e "$file" ]; then
        echo "Checking $file..."
        if ! jq -r 'paths(type == "object" and .completion | type != "string") | join(".") | . + " in " + input_filename' --argjson input_filename "$file" < "$file" >> "$problem_log"; then
            echo "Error processing $file. Skipping..."
        fi
    else
        echo "File does not exist: $file"
    fi
done

echo "Check $problem_log for problematic 'completion' fields."
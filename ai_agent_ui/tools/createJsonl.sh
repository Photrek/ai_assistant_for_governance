#!/bin/bash

# Directory where your JSON files are located
json_dir="../training_data/raw_json/"

# Directory where the combined JSONL file should be saved
jsonl_dir="../training_data/jsonl/"

# Create JSONL directory if it doesn't exist
mkdir -p "$jsonl_dir"

# Path for the combined JSONL file
combined_file="$jsonl_dir/combined.jsonl"

# Clear or create the combined file
> "$combined_file"

# Loop through all JSON files in the directory
for json_file in "$json_dir"/*.json; do
    # Use jq to convert each JSON file to JSONL and append to combined file
    jq -c '.[]' "$json_file" >> "$combined_file"
    
    echo "Appended $json_file to $combined_file"
done

echo "Combination complete! All JSON files are now in $combined_file"
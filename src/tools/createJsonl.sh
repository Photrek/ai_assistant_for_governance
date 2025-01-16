#!/bin/bash

# Directory where your JSON files are located
json_dir="../training_data/raw_json/"

# Directory where JSONL files should be saved
jsonl_dir="../training_data/jsonl/"

# Create JSONL directory if it doesn't exist
mkdir -p "$jsonl_dir"

# Loop through all JSON files in the directory
for json_file in "$json_dir"/*.json; do
    # Get the filename without the path
    base_name=$(basename "$json_file" .json)
    
    # Convert JSON to JSONL
    # jq is used here to parse JSON and output each JSON object on a new line
    jq -c '.[]' "$json_file" > "$jsonl_dir/$base_name.jsonl"
    
    echo "Converted $json_file to $jsonl_dir/$base_name.jsonl"
done

echo "Conversion complete!"
# Examples

This directory contains example ProvenanceCode records and configurations.

## Example 1: Basic Decision

See `example-decision.json` for a complete decision record example.

## Example 2: Risk with Linked Decision

See `example-risk.json` for a risk record that references a decision.

## Usage

```bash
# Copy these examples to your provenance directory
cp examples/example-decision.json provenance/decisions/DEC-MYAPP-CORE-000001.json
cp examples/example-risk.json provenance/risks/RSK-MYAPP-CORE-000001.json

# Update the IDs to match your config
# Then validate
npx prvc validate
```


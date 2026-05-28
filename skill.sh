#!/usr/bin/env bash

declare -A SKILLS=(
  [variant-design]="SKILL.md"
  [variant-generate]="skills/variant-generate/SKILL.md"
  [variant-design-system]="skills/variant-design-system/SKILL.md"
  [variant-component]="skills/variant-component/SKILL.md"
  [variant-analyze]="skills/variant-analyze/SKILL.md"
  [variant-ux]="skills/variant-ux/SKILL.md"
  [variant-code-output]="skills/shared/code-output.md"
)

if [[ $# -eq 0 ]]; then
  echo "Usage: source ./skill.sh <skill-name>"
  echo "Available skills: ${!SKILLS[@]}"
else
  echo "${SKILLS[$1]}"
fi

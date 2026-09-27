#!/usr/bin/env bash

if [ "$#" -eq 0 ]; then
  echo "Usage: ./skill.sh <skill-name>"
  echo "Available skills: variant-design variant-generate variant-design-system variant-component variant-analyze variant-ux variant-code-output"
  return 0 2>/dev/null || exit 0
fi

case "$1" in
  variant-design)        echo "SKILL.md" ;;
  variant-generate)      echo "skills/variant-generate/SKILL.md" ;;
  variant-design-system) echo "skills/variant-design-system/SKILL.md" ;;
  variant-component)     echo "skills/variant-component/SKILL.md" ;;
  variant-analyze)       echo "skills/variant-analyze/SKILL.md" ;;
  variant-ux)            echo "skills/variant-ux/SKILL.md" ;;
  variant-code-output)   echo "skills/shared/code-output.md" ;;
  *)
    echo "Unknown skill: $1" >&2
    return 1 2>/dev/null || exit 1
    ;;
esac

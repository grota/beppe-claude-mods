# collapse-tools

A Claude Code mod that shows tool calls collapsed in the transcript. Click the chevron to expand or collapse a call.

```
▸ Bash(npm test) ✓ 142 lines
▾ Edit(src/app.ts)   ← kept expanded by default
```

- Running calls stay expanded and collapse when they finish, unless you toggled them.
- Failed calls and the tools listed in `expandedTools` start expanded.
- Folded runs of reads and searches get a chevron that unfolds them.
- Agent calls start collapsed, hiding their nested calls.
- Toggles reset each session.

Clicks work in fullscreen mode, including inside tmux with `set -g mouse on`. Outside fullscreen, use the command below.

## Install

At the Claude Code prompt:

```
/plugin install collapse-tools --marketplace grota/beppe-claude-mods
```

Answer `y` to add the marketplace, then pick a scope.

To run it from a local checkout instead:

```
claude --plugin-dir /path/to/beppe-claude-mods/plugins/collapse-tools
```

## Command

`/collapse all`, `/collapse none`, or `/collapse` (toggle between expanded and the default state).

To bind the toggle to `ctrl+x c`, add this to `~/.claude/keybindings.json`:

```json
{
  "bindings": [
    { "context": "Global", "bindings": { "ctrl+x c": "command:collapse" } }
  ]
}
```

## Settings

Edit these in `/config`:

| Option              | Default                                                  | Effect                                    |
| ------------------- | -------------------------------------------------------- | ----------------------------------------- |
| `enabled`           | `true`                                                   | Turn the mod off without uninstalling it  |
| `expandedTools`     | Edit, Write, NotebookEdit, AskUserQuestion, ExitPlanMode | Comma-separated tools that start expanded |
| `collapseSubagents` | `true`                                                   | Start Agent calls collapsed               |

## Develop

```
claude plugin validate .
claude plugin test .
```

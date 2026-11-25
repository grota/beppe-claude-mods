# beppe-claude-mods

A Claude Code plugin marketplace with Giuseppe Rota's mods.

| Mod                                                | What it does                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------------- |
| [collapse-tools](plugins/collapse-tools/README.md) | Collapses tool calls in the transcript; click the chevron to expand or collapse |
| [prompt-navigator](plugins/prompt-navigator/README.md) | Lists your prompts in a side pane; press one to jump to it |

## Install a mod

At the Claude Code prompt, replacing `<mod>` with a name from the table:

```
/plugin install <mod> --marketplace grota/beppe-claude-mods
```

## Add a mod

Put each mod in `plugins/<name>/` and list it in `.claude-plugin/marketplace.json` with `"source": "./plugins/<name>"`.

```
claude plugin validate .
claude plugin validate plugins/<name>
claude plugin test plugins/<name>
```

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Mode, Overrides } from '../types'
import { keyArgument, outputSize, statusMark, truncate } from './summary'
import type { CallStatus } from './summary'

const mode = atom({ plugin: 'collapse-tools', key: 'mode' } as const, 'auto' as Mode)
const overrides = atom({ plugin: 'collapse-tools', key: 'overrides' } as const, {} as Overrides)

const AGENT_TOOLS = ['Agent', 'Task']
const MODES: Record<string, Mode> = { all: 'collapsed', none: 'expanded' }

async function isOpen($: EngineInterface, id: string, auto: boolean): Promise<boolean> {
  const chosen = (await read($, overrides))[id]
  if (chosen !== undefined) {
    return chosen
  }
  const current = await read($, mode)

  return current === 'auto' ? auto : current === 'expanded'
}

async function setOpen($: EngineInterface, id: string, open: boolean): Promise<void> {
  await update($, overrides, all => ({ ...all, [id]: open }))
}

export const register: Register = (on, options) => {
  if (options.enabled === false) {
    return
  }
  const expandedTools = Array.isArray(options.expandedTools) ? options.expandedTools : []
  const collapseSubagents = options.collapseSubagents !== false

  const startsOpen = (tool: string, status: CallStatus): boolean =>
    status.isRunning ||
    status.isErrored ||
    status.isInterrupted ||
    expandedTools.includes(tool) ||
    (!collapseSubagents && AGENT_TOOLS.includes(tool))

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'collapse',
      description: 'Collapse or expand tool calls: all, none, or toggle (default)',
      argumentHint: 'all|none|toggle',
    })

    return next(e)
  })

  on('command.run', { command: 'collapse' }, async ($, e) => {
    const arg = e.args.trim() || 'toggle'
    const current = await read($, mode)
    const target = arg === 'toggle' ? (current === 'expanded' ? 'auto' : 'expanded') : MODES[arg]
    if (target === undefined) {
      return { text: `Unknown argument "${arg}": use all, none or toggle.` }
    }
    await update($, overrides, () => ({}))
    await update($, mode, () => target)
    const words: Record<Mode, string> = {
      auto: 'Tool calls back to their default state.',
      collapsed: 'All tool calls collapsed.',
      expanded: 'All tool calls expanded.',
    }

    return { text: words[target] }
  })

  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    const { tool, tool_use_id: id, input, output } = e.props
    const open = await isOpen($, id, startsOpen(tool, e.props))
    const { Box, Button, Text } = $.ui.resolve(e)
    const chevron = (
      <Button
        key={`chevron-${id}`}
        plain
        label={open ? '▾' : '▸'}
        onPress={() => setOpen($, id, !open)}
      />
    )

    if (open) {
      return (
        <Box flexDirection="row">
          {chevron}
          <Text> </Text>
          {await next(e)}
        </Box>
      )
    }

    const columns = e.viewport?.columns ?? 100
    const argument = keyArgument(input)
    const size = e.props.isRunning ? undefined : outputSize(output)
    const mark = statusMark(e.props)

    return (
      <Box flexDirection="row">
        {chevron}
        <Text>
          {' '}
          <Text bold>{tool}</Text>
          {argument === undefined
            ? ''
            : `(${truncate(argument, Math.max(20, columns - tool.length - 30))})`}{' '}
          <Text dimColor>
            {mark}
            {size === undefined ? '' : ` ${size}`}
          </Text>
        </Text>
      </Box>
    )
  })

  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    const status = { isRunning: false, isErrored: e.props.isErrored, isInterrupted: false }
    if (await isOpen($, e.props.tool_use_id, startsOpen(e.props.tool, status))) {
      return next(e)
    }
    const { Box } = $.ui.resolve(e)

    return <Box />
  })

  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    if (e.props.isExpanded) {
      return next(e)
    }
    const id = `group-${e.requestId}`
    const open = await isOpen($, id, false)
    const { Box, Button, Text } = $.ui.resolve(e)
    const chevron = (
      <Button key={id} plain label={open ? '▾' : '▸'} onPress={() => setOpen($, id, !open)} />
    )

    if (!open) {
      return (
        <Box flexDirection="row">
          {chevron}
          <Text> </Text>
          {await next(e)}
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        <Box flexDirection="row">
          {chevron}
          <Text dimColor> {e.props.calls.length} calls</Text>
        </Box>
        {await next({ ...e, props: { ...e.props, isExpanded: true } })}
      </Box>
    )
  })
}

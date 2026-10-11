import { expect, test } from 'claude-code/testing'
import type { RenderPropsOf } from 'claude-code'

const SURFACES = ['terminal', 'desktop'] as const

const COMMAND = {
  command: 'collapse',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: true, columns: 100 },
} as const

const BASH_ROW: RenderPropsOf['ToolUse'] = {
  tool_use_id: 'toolu_1',
  tool: 'Bash',
  input: { command: 'npm test' },
  isRunning: false,
  isErrored: false,
  isInterrupted: false,
  output: { stdout: 'a\nb\nc\n', stderr: '' },
}

const EDIT_ROW: RenderPropsOf['ToolUse'] = {
  ...BASH_ROW,
  tool_use_id: 'toolu_2',
  tool: 'Edit',
  input: { file_path: '/tmp/x.ts' },
  output: {},
}

for (const surface of SURFACES) {
  test(`${surface}: a Bash call starts collapsed with a summary`, async ($, on) => {
    on('ui.render', ($, e) => {
      const { Text } = $.ui.resolve(e)
      return <Text>engine row</Text>
    })
    const ui = await $.ui.mount({ plugin: 'collapse-tools', surface, component: 'ToolUse', props: BASH_ROW })

    expect((await ui.find({ key: 'chevron-toolu_1' }))?.props.label).toBe('▸')
    expect(await ui.find({ text: 'engine row' })).toBeUndefined()
    expect(await ui.find({ text: /npm test/ })).toBeDefined()
    expect(await ui.find({ text: /✓ 3 lines/ })).toBeDefined()
  })

  test(`${surface}: clicking the chevron expands and collapses`, async ($, on) => {
    on('ui.render', ($, e) => {
      const { Text } = $.ui.resolve(e)
      return <Text>engine row</Text>
    })
    const ui = await $.ui.mount({ plugin: 'collapse-tools', surface, component: 'ToolUse', props: BASH_ROW })

    await ui.press({ key: 'chevron-toolu_1' })
    expect((await ui.find({ key: 'chevron-toolu_1' }))?.props.label).toBe('▾')
    expect(await ui.find({ text: 'engine row' })).toBeDefined()

    await ui.press({ key: 'chevron-toolu_1' })
    expect(await ui.find({ text: 'engine row' })).toBeUndefined()
  })

  test(`${surface}: Edit stays expanded by default`, async ($, on) => {
    on('ui.render', ($, e) => {
      const { Text } = $.ui.resolve(e)
      return <Text>engine row</Text>
    })
    const ui = await $.ui.mount({ plugin: 'collapse-tools', surface, component: 'ToolUse', props: EDIT_ROW })

    expect(await ui.find({ text: 'engine row' })).toBeDefined()
  })

  test(`${surface}: a running call stays expanded, then collapses when done`, async ($, on) => {
    on('ui.render', ($, e) => {
      const { Text } = $.ui.resolve(e)
      return <Text>engine row</Text>
    })
    const running = { ...BASH_ROW, isRunning: true, output: undefined }
    const ui = await $.ui.mount({ plugin: 'collapse-tools', surface, component: 'ToolUse', props: running })
    expect(await ui.find({ text: 'engine row' })).toBeDefined()

    await ui.redraw(BASH_ROW)
    expect(await ui.find({ text: 'engine row' })).toBeUndefined()
  })
}

test('the result of a collapsed call is hidden', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine result</Text>
  })
  const ui = await $.ui.mount({
    plugin: 'collapse-tools',
    surface: 'terminal',
    component: 'ToolResult',
    props: { tool_use_id: 'toolu_1', tool: 'Bash', output: BASH_ROW.output, isErrored: false },
  })

  expect(await ui.find({ text: 'engine result' })).toBeUndefined()
})

test('/collapse none expands every call, /collapse all collapses Edit too', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine row</Text>
  })
  const bash = await $.ui.mount({ plugin: 'collapse-tools', surface: 'terminal', component: 'ToolUse', props: BASH_ROW })
  const edit = await $.ui.mount({ plugin: 'collapse-tools', surface: 'terminal', component: 'ToolUse', props: EDIT_ROW })

  await $.command.run({ ...COMMAND, args: 'none' })
  await bash.redraw()
  expect(await bash.find({ text: 'engine row' })).toBeDefined()

  await $.command.run({ ...COMMAND, args: 'all' })
  await edit.redraw()
  expect(await edit.find({ text: 'engine row' })).toBeUndefined()
})

test('disabled: rows draw as the engine does', { options: { enabled: false } }, async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine row</Text>
  })
  const ui = await $.ui.mount({ plugin: 'collapse-tools', surface: 'terminal', component: 'ToolUse', props: BASH_ROW })

  expect(await ui.find({ text: 'engine row' })).toBeDefined()
})

module.exports = {
  description: 'Add an unconnected component to Game folder',
  prompts: [
    {
      type: 'list',
      name: 'type',
      message: 'Select the type of component',
      default: 'Styled',
      choices: () => ['Styled', 'Stateless Function'],
    },
    {
      type: 'input',
      name: 'name',
      message: 'Component name?',
      default: 'Button',
    },
  ],
  actions: (data) => {
    let componentActions = []

    switch (data.type) {
      case 'Stateless Function': {
        componentActions = [
          {
            type: 'add',
            path: '../../components/{{dashCase name}}/index.tsx',
            templateFile: './component/stateless.js.hbs',
            abortOnFail: true,
          },
        ]
        break
      }
      case 'Styled': {
        componentActions = [
          {
            type: 'add',
            path: '../../components/{{dashCase name}}/index.tsx',
            templateFile: './component/styled.js.hbs',
            abortOnFail: true,
          },
        ]
        break
      }
      default: {
        componentTemplate = './component/class.js.hbs'
      }
    }

    return [
      ...componentActions,
      {
        type: 'prettier',
        path: '/components/',
      },
    ]
  },
}

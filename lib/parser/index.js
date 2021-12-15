const { parse } = require('graphql');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv)).argv;

const { syntax = 'commonjs' /** esm, ts */ } = argv;

const getExportBySyntax = queryName => {
  if (syntax === 'commonjs') {
    return `module.exports.${(queryName)}`;
  } else if (syntax === 'esm' || syntax === 'ts') {
    return `export const ${(queryName)}`;
  }
};

const addTabs = (tabs, additional) => '\t'.repeat(tabs + additional);

const getBodyTypeName = data => {
  let typeName = '';

  if (data) {
    const { kind, type } = data;
    if (kind === 'NamedType') {
      typeName = data.name.value;
    } else {
      typeName = getBodyTypeName(type);
    }
  }

  return typeName;
};

const argumentsParser = (_queryName = '', arguments = [], title) => {
  let firstArg = '';
  let secondArg = '';
  let argRes = '';

  if (arguments.length > 0) {
    for (let arg of arguments) {
      const { name, type } = arg;
      argRes = argRes + `\n\t\t$${name.value}` + ': ' + argumentTypeParser(type);
      firstArg = `${title}(${argRes}\n\t)`;
      secondArg = secondArg + ('\n\t\t\t' + name.value + ': $' + name.value);
    }
  }

  if (secondArg) {
    secondArg = '(' + secondArg + '\n\t\t)';
  }

  return [firstArg, secondArg];
};

const queryParser = (definitions, current = null, title = 'query') => {
  const query = {};

  if (current) {
    const queryName = current.name.value;
    const [firstArg, secondArg] = argumentsParser(queryName, current.arguments, title);
    const curetnTypeName = getBodyTypeName(current.type);
    const body = budyParser(definitions, current.type, [curetnTypeName]);

    query['returnTypeName'] = curetnTypeName;
    query['queryString'] =
      getExportBySyntax(queryName) +
      ' = gql`\n\t' +
      firstArg +
      '{\n\t\t' +
      queryName +
      secondArg +
      body +
      '\n\t}\n' +
      '`';
  }
  return query;
};

const parser = schema => {
  const document = parse(schema);
  let queriesArray = [];
  let mutationsArray = [];

  if (document && document.definitions && document.definitions.length > 0) {
    const { definitions } = document;

    const queries = definitions.find(item => item.name.value === 'Query');
    const mutations = definitions.find(item => item.name.value === 'Mutation');
    if (queries) {
      queriesArray = queries.fields.map(item => {
        const q = queryParser(definitions, item, 'query');
        return q;
      });
    }
    if (mutations) {
      mutationsArray = mutations.fields.map(item => {
        const m = queryParser(definitions, item, 'mutation');
        return m;
      });
    }
  } else {
    console.log('error document');
  }

  return {
    queries: queriesArray,
    mutations: mutationsArray,
  };
};

const argumentTypeParser = data => {
  let res = '';

  if (data) {
    const { kind, type, name } = data;
    if (kind === 'NamedType') {
      res = name.value;
    }
    if (kind === 'ListType') {
      res = `[${argumentTypeParser(type)}]`;
    }
    if (kind === 'NonNullType') {
      res = argumentTypeParser(type) + `!`;
    }
  }

  return res;
};

const budyParser = (definitions, data, prevTypeName = []) => {
  let res = '';
  let returnTypeName = getBodyTypeName(data);
  let returnType = definitions.find(item => item.name.value === returnTypeName);
  const level = prevTypeName.length;

  if (returnType) {
    const { fields } = returnType;
    if (fields) {
      for (let f of fields) {
        let name = '';

        const fieldTypeName = getBodyTypeName(f.type);
        const prevFieldTypeName = prevTypeName[level - 2];
        const nextType = definitions.find(item => item.name.value === fieldTypeName);

        if (level < 4 && prevFieldTypeName !== fieldTypeName) {
          if (nextType) {
            const nextBody = budyParser(definitions, f.type, [...prevTypeName, fieldTypeName]);
            name = f.name.value + nextBody;
          } else {
            name = f.name.value;
          }
        }
        if (name) {
          res = res + `\n${addTabs(2, level)}${name}`;
        }
      }
    }
  }

  return res ? `{${res}\n${addTabs(1, level)}}` : '';
};

module.exports = {
  parser,
};

const fetch = require('node-fetch');
const { getIntrospectionQuery, buildClientSchema, printSchema } = require('graphql');
const { parser } = require('./parser');
const { printToFile, readFile } = require('./fs');

async function getRemoteSchema(endpoint, method, headers, saveType) {
  if (!endpoint) {
    return console.log({ status: 'err', message: "Endpoint can't be an empty string" });
  }

  const { data, errors } = await fetch(endpoint, {
    method: method ? method : 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ query: getIntrospectionQuery() }),
  })
    .then(res => res.json())
    .catch(errors => ({ errors }));

  if (errors) {
    return console.error({ status: 'err', message: JSON.stringify(errors, null, 2) });
  }
  const schema = buildClientSchema(data);
  const res = parser(printSchema(schema));
  printToFile(res, saveType);
}

async function readFromFile(path, saveType) {
  const res = readFile(path);
  printToFile(res, saveType);
}

module.exports = {
  getRemoteSchema,
  readFromFile,
  printToFile,
  readFile,
};

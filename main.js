const { getRemoteSchema, readFromFile } = require('./lib');

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;

const {
  endpoint,
  headers = '{}',
  method = 'POST',
  savetype = 'one file', // 'by return types', 'by queries and mutations types'
} = argv;

const init = async () => {
    let type = 0;
    switch (savetype) {
      case 'by return types': {
        type = 1;
        break;
      }
      case 'by queries and mutations types': {
        type = 2;
        break;
      }
      default:
        break;
    }
    if (endpoint) {
      if (endpoint.match(/^(http|https)/gm)) {
        const reqHeaders = JSON.parse(headers);
        const methodToSend = method;

        getRemoteSchema(endpoint, methodToSend, reqHeaders, type);
      } else {
        readFromFile(endpoint, type);
      }
  } else {
    console.error(
      'Endpoint was not found, please use --endpoint, for example --endpoint="https://backend.com/graphql"',
    );
  }
};

function gql(chunks, ...variables) {
  return chunks.reduce(
    (accumulator, chunk, index) => `${accumulator}${chunk}${index in variables ? variables[index] : ''}`,
    '',
  );
}

module.exports = {
  init,
  gql,
};

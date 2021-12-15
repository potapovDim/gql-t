const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;
const { prettifyCamelCaseToDelimeter } = require('sat-utils');

const { createFolder } = require('../lib/fs/index');
const fs = require('fs');
const path = require('path');

const { mutationsPath, testsPathName } = argv;
createFolder(testsPathName);
const mutations = require(path.resolve(process.cwd(), mutationsPath));

const getFileTemplate = (name, path) => {
  return `
  const { ${name} } = require('${path}')

  describe('${name}', () => {

    it('[P] ${name}', async () => {})

    it('[N] ${name}', async () => {})
  })
  `;
};

for (const mutation of Object.keys(mutations)) {
  const pathToSave = path.resolve(process.cwd(), testsPathName, `${prettifyCamelCaseToDelimeter(mutation)}.spec.js`);
  const fileContent = getFileTemplate(mutation, path.relative(`./${testsPathName}`, mutationsPath));
  fs.writeFileSync(pathToSave, fileContent);
}

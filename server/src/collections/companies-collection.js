const getDBFunctions = require('../db/db-functions');
const { findUserById } = require('./users-collection');

const collectionName = 'companies';
const { insert, findById, findAll } = getDBFunctions(collectionName);

const insertCompany = async (company) => await insert({ ...company, userScoring: [] });

const findAllCompanies = async () => await findAll();

const calcCompanyScore = async (companyId, userId) => {
  const company = await findCompanyById(companyId);
  const { settings } = await findUserById(userId);
  const companyData = { ...company };
  const { userScoring } = companyData;
  companyData.userScoringAvg = userScoring.reduce((a, b) => a + b, 0) / userScoring.length;
  const companyScore = Object.keys(settings)
    .reduce((score, settingKey) => score + companyData[settingKey] * settings[settingKey], 0);
  return companyScore;
};

module.exports = {
  insertCompany, calcCompanyScore, findAllCompanies,
};

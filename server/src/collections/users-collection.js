const { adminUser } = require('../config');
const getDBFunctions = require('../db/db-functions');
const { findDefaultSettings } = require('./default-settings-collection');

const collectionName = 'users';
const {
  updateById, insert, findById, findByName, findAll,
} = getDBFunctions(collectionName);

const insertUser = async (user) => {
  const { username, password } = user;
  const existingUser = await findByName(username);
  if (existingUser) throw new Error('Conflict');
  else {
    const settings = await findDefaultSettings();
    const formattedUser = {
      username, password, settings, role: 'user',
    };
    const { insertedId } = await insert(formattedUser);
    return { ...formattedUser, _id: insertedId };
  }
};

const findUserById = async (userId) => await findById(userId);

const validateLogin = async (userInfo) => {
  const user = await findByName(userInfo.username);
  if (user && userInfo.password === user.password) {
    const {
      _id, username, role, settings,
    } = user;
    return {
      _id, username, role, settings,
    };
  } throw new Error('Unauthorized');
};

const isUpdateForbidden = async (userId, settingsUpdate) => {
  const user = await findUserById(userId);
  return user?.role !== 'admin' && settingsUpdate.userScoring;
};

const validateSettings = (settings) => {
  const sumOfWeights = Object.values(settings).reduce((a, b) => +(a + b).toFixed(2), 0);
  return sumOfWeights === 1;
};

const updateUserSettingsById = async (userId, settingsUpdate) => {
  const updateForbidden = await isUpdateForbidden(userId, settingsUpdate);
  const defaultSettings = await findDefaultSettings();
  const newSettings = { ...defaultSettings, ...settingsUpdate };
  if (updateForbidden || !validateSettings(newSettings)) throw new Error('Forbidden');
  return await updateById(userId, { settings: newSettings });
};

const initAdminUser = async () => {
  const adminUsers = await findAll({ role: 'admin' });
  if (adminUsers.length) return;
  const settings = await findDefaultSettings();
  const newAdminUser = { ...adminUser, settings };
  await insert(newAdminUser);
};

module.exports = {
  updateUserSettingsById, insertUser, findUserById, validateLogin, initAdminUser,
};

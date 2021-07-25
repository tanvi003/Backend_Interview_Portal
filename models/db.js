const Sequelize = require('sequelize');

const db = new Sequelize({
  dialect: 'sqlite',
  storage: 'participants.db',
})

const Participants = db.define('participant', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
})

const Interviews = db.define('interview', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  
  date: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  startTime: {
    type: Sequelize.TIME,
    allowNull: false,
  },
  endTime: {
    type: Sequelize.TIME,
    allowNull: false,
  }
})

Interviews.belongsTo(Participants);

module.exports = {
  db, Participants, Interviews
}
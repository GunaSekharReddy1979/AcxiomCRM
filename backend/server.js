const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection verified successfully.');

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` AcxiomCRM Enterprise API Server Running`);
      console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(` URL:  http://localhost:${PORT}`);
      console.log(` Database: ${process.env.DB_NAME || 'acxiomcrm_db'} on ${process.env.DB_HOST || 'localhost'}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();

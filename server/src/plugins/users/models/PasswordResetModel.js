'use strict';
module.exports = function(sequelize, DataTypes) {
  var PasswordReset = sequelize.define('PasswordReset', {
    token: DataTypes.STRING(32)
  },
  {
    tableName: "password_resets",
    classMethods: {
      associate: function(models) {
        models.User.hasOne(PasswordReset,{ foreignKey: "user_id" });
      }
    }
  });
  return PasswordReset;
};

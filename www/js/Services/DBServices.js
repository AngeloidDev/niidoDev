"use strict";
appServices.service('DBServices', ['Utils', function (Utils) {
  var _DB;
  var isDbOpen = false;

  function isOpen() {
    return isDbOpen;
  }

  function init() {
    return Utils.$q(function (resolve, reject) {
      _openDB().then(function () {
        _loadDB().then(function () {
          isDbOpen = true;
          //just for debugging...
          /*_showDBTables().then(function (tables) {
            Utils.alert.show("DB Tables"+tables);
          }, function (error) {
            console.log("Can't get DB Tables", error);
            Utils.alert.show("Can't get DB Tables");
          });*/

          resolve(_DB)
        }, function (error) {
          reject(error)
        })
      }, function (error) {
        reject(error)
      })
    })
  }

  /**
   * @return Promise
   * @private
   */
  function _loadDB() {
    return Utils.$q(function (resolve, reject) {
      var sqlStatements = [
        'CREATE TABLE IF NOT EXISTS userLogCount (id INTEGER PRIMARY KEY, name TEXT, count INTEGER)',
        'CREATE TABLE IF NOT EXISTS tutorials (id INTEGER PRIMARY KEY, name TEXT, visited TEXT)',
        'CREATE TABLE IF NOT EXISTS chat_list ("id"  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "lastMessageId"  INTEGER NOT NULL)',
        'CREATE TABLE IF NOT EXISTS chat_contact_list ("id"  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "name"  TEXT(255) NOT NULL, "avatar"  TEXT(500) NOT NULL, "status"  INTEGER NOT NULL)',
        'CREATE TABLE IF NOT EXISTS chat_group_list ("id"  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "ownerId"  INTEGER NOT NULL, "name"  TEXT(255) NOT NULL, "avatar"  TEXT(500), "status"  INTEGER NOT NULL, "creationDate"  TEXT(60) NOT NULL)',
        'CREATE TABLE IF NOT EXISTS chat_group_member_list ("contactId"  INTEGER NOT NULL, "groupId"  INTEGER NOT NULL, "status"  INTEGER NOT NULL, PRIMARY KEY ("contactId" ASC, "groupId" ASC))',
        'CREATE TABLE IF NOT EXISTS chat_message_list ("id"  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "text"  TEXT(500) NOT NULL, "groupId"  INTEGER, "contactId"  INTEGER, "sentDate"  TEXT(60) NOT NULL, "receivedDate"  TEXT(60) NOT NULL, "isMine"  INTEGER NOT NULL DEFAULT 0, "status"  INTEGER NOT NULL)'
      ];

      batch(sqlStatements).then(function (/*nothing*/) {
        /*sqlStatements = [
          'INSERT INTO chat_list values (null, 1)',
          'INSERT INTO chat_list values (null, 2)',

          'INSERT INTO chat_contact_list values (1, "Andres", "no url", 1)',
          'INSERT INTO chat_contact_list values (22, "Ernesto", "no url", 1)',
          'INSERT INTO chat_contact_list values (33, "Mario", "no url", 1)',
          'INSERT INTO chat_contact_list values (44, "Juan", "no url", 1)',

          'INSERT INTO chat_message_list values (null, "msg uno", null, 22, 1230, 1230, 0, 1)',
          'INSERT INTO chat_message_list values (null, "msg dos", null, 1, 1230, 1230, 1, 1)'
        ];

        batch(sqlStatements).then(function () {
          resolve();
        }, function (error) {
          console.error("Can't add test records to DB", error);
          reject(error);
        })*/
        resolve();
      }, function (error) {
        console.error("Couldn't initialize DB", error);
        reject(error);
      })
    })
  }

  /**
   * @private
   * @return Promise
   */
  function _openDB() {
    return Utils.$q(function (resolve, reject) {
      window.sqlitePlugin.openDatabase({
        name: 'personalInfo.db',
        location: 'default',
        androidDatabaseImplementation: 2,
        androidLockWorkaround: 1
      }, function (dbInstance) {
        _DB = dbInstance;
        resolve();
      }, function (error) {
        console.error('Open database ERROR: ');
        reject(error)
      });
    })
  }

  /**
   * @param dbResponse
   * @return {Object[]}
   */
  function extractItems(dbResponse) {
    var items = [], i = 0, len = dbResponse.rows.length;

    for (i; i < len; i++) {
      items.push(dbResponse.rows.item(i));
    }

    return items;
  }

  /**
   * @param dbResponse
   * @param rowNumber {number}
   * @return {Object}
   */
  function getItem(dbResponse, rowNumber) {
    return dbResponse.rows.item(rowNumber);
  }

  /**
   * @param dbResponse
   * @param callback {function(Object, number?)}
   */
  function iterate(dbResponse, callback) {
    var i = 0, len = dbResponse.rows.length;

    for (i; i < len; i++)
      callback(dbResponse.rows.item(i), i)
  }

  /**
   * Just for debugging if DB was loaded correctly
   * @private
   * @return Promise {string|*}
   */
  function _showDBTables() {
    console.log("Executing: _showDBTables");
    return Utils.$q(function (resolve, reject) {
      execute("SELECT name FROM sqlite_master WHERE type = 'table'").then(function (resp) {
        var tables = '', i = 0, len = resp.rows.length;

        for (i; i < len; i++) {
          tables += "<br>'" + resp.rows.item(i).name + "'";
        }

        resolve(tables)
      }, function (error) {
        reject(error)
      })
    })
  }

  /**
   * @param query
   * @param paramsArray
   * @return Promise {dbResponseType|*}
   */
  function execute(query, paramsArray) {
    paramsArray = paramsArray || [];
    return Utils.$q(function (resolve, reject) {
      _DB.executeSql(query, paramsArray, function (rs) {
        resolve(rs)
      }, function (error) {
        reject(error)
      })
    })
  }

  /**
   * @param {Array} sqlStatements
   * @return Promise
   */
  function batch(sqlStatements) {
    return Utils.$q(function (resolve, reject) {
      _DB.sqlBatch(sqlStatements, function (/*nothing*/) {
        resolve()
      }, function (error) {
        reject(error)
      });
    })
  }

  function getChatListTable() {
    $cordovaSQLite.execute(_DB, "query here, values (?,?,...)", [1, 2, '...']).then(function () {

    }, function (error) {

    })
  }

  function getGroupListTable() {

  }

  function getContactListTable() {

  }

  function createQuery() {

  }

  return {
    isOpen: isOpen,
    init: init,
    execute: execute,
    batch:batch,
    extractItems: extractItems,
    getItem: getItem,
    iterate: iterate,
    getChatListTable: getChatListTable,
    getGroupListTable: getGroupListTable,
    getContactListTable: getContactListTable
  }

}]);

/**
 * @typedef {Object} dbResponseType
 * @property {{length:number, item?:*}} rows
 * @property {number} rowsAffected
 * @property {number} insertId
 */

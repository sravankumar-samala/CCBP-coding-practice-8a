const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db;

(async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server started at port: 3000");
    });
  } catch (error) {
    console.log(error.message);
  }
})();

const hasPriorityAndStatus = (priority, status) =>
  priority !== undefined && status !== undefined;

const isNotEqualUndefined = (variable) => variable !== undefined;

// scenario-1 /todos/?status=TO%20DO
// scenario-2 /todos/?priority=HIGH
// scenario-3 /todos/?priority=HIGH&status=IN%20PROGRESS
// scenario-4 /todos/?search_q=Play

app.get("/todos/", async (req, res) => {
  try {
    let { search_q = "", priority, status } = req.query;
    let getTodoQuery;

    switch (true) {
      case hasPriorityAndStatus(priority, status):
        getTodoQuery = `SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%' AND priority = '${priority}' AND
            status = '${status}';`;
        break;
      case isNotEqualUndefined(priority):
        getTodoQuery = `SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%' AND priority = '${priority}';`;
        break;
      case isNotEqualUndefined(status):
        getTodoQuery = `SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%' AND status = '${status}';`;
        break;
      default:
        getTodoQuery = `SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%';`;
        break;
    }

    const todosArr = await db.all(getTodoQuery);
    res.send(todosArr);
  } catch (error) {
    console.log(error.message);
  }
});

// get object based on Id
app.get("/todos/:Id", async (req, res) => {
  try {
    const todoId = req.params.Id;
    const updateTodoQuery = `
        SELECT * FROM todo WHERE id = ${todoId};`;

    const todoObj = await db.get(updateTodoQuery);
    [todoObj].map((obj) => res.send(obj));
  } catch (error) {
    console.log(error.message);
  }
});

// posting new todo to db
app.post("/todos/", async (req, res) => {
  try {
    const { id, todo, priority, status } = req.body;
    const putQuery = `
        INSERT INTO todo (id, todo, priority, status)
        VALUES ('${id}', '${todo}', '${priority}', '${status}');`;
    await db.run(putQuery);
    res.send("Todo Successfully Added");
  } catch (error) {
    console.log(error.message);
  }
});

// DELETE todo object by id
app.delete("/todos/:Id", async (req, res) => {
  try {
    const todoId = req.params.Id;
    const deleteQuery = `DELETE FROM todo WHERE id = ${todoId};`;
    await db.run(deleteQuery);
    res.send("Todo Deleted");
  } catch (error) {
    console.log(error.message);
  }
});

// update todos bases on Id on diff scenarios.
//if status ? Status Updated
//if Priority ? Priority Updated
//if todo ? todo Updated

app.put("/todos/:Id", async (req, res) => {
  try {
    const todoId = req.params.Id;
    const { status, priority, todo } = req.body;
    let updateTodoQuery, responseMsg;

    switch (true) {
      case isNotEqualUndefined(status):
        updateTodoQuery = `UPDATE todo SET status = '${status}' WHERE id = ${todoId};`;
        responseMsg = "Status Updated";
        break;
      case isNotEqualUndefined(priority):
        updateTodoQuery = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId};`;
        responseMsg = "Priority Updated";
        break;
      default:
        updateTodoQuery = `UPDATE todo SET todo = '${todo}' WHERE id = ${todoId};`;
        responseMsg = "Todo Updated";
        break;
    }

    await db.run(updateTodoQuery);
    res.send(responseMsg);
  } catch (err) {
    console.log(err.message);
  }
});

//exporting the app
module.exports = app;

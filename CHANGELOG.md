# Changelog

Each release has a section headed "## <version>". The server's "What's new" bundle and the release check read these
sections: a release needs its section here.

## 0.0.5

- The experiment header shows the display name as its title and the task name as "Task: name"; the Rename task item in the experiment menu changes the task name.
- The task list has a Title column with the display name and a Task name column.
- The Tasks list shows the trials of a hyperparameter search under their search, as a group that can be collapsed.
- The footer shows the server version without a trailing hyphen when the server reports no build number.
- A running task shows a progress bar and its percentage in the task list, the dashboard and the compare view, and n/a when it has no estimate yet.
- Queues show their real name, the one that --queue takes, in the Queues table, the task details and the agent welcome message.
- The project Overview is a board of cards; the Edit the board button, shown to people who can edit the project, switches the board to editing.
- The Import run dialog names the project in its result line instead of showing the project id.
- Repositories & Datasets lists code repositories, datasets and registries in one list; a row has a Check now button, and Make shared in its menu when you can share it.
- The repository browser has a Git graph tab with the commits that tasks ran on.
- Settings no longer has the Storage cleanup page.
- The notices that a run published a dataset to a project appear in the bottom right corner of the page, so they no longer cover the buttons in the page header.
- The setup steps for a Jupyter notebook say to enrol with cairnml init; they no longer ask for API access keys.
- On the Repositories page, a failed read of the repository list, a repository's history or the add-repository dialog shows an error note instead of an empty list. Other pages are not changed yet.
- When the server refuses a credential, repository or sharing request, the message shows the server's reason; other refused requests still show their own text.
- The agent welcome message, shown when a queue has no agent, now says to install the agent with pip and the cairnml agent extra, instead of the separate cairnml-agent package.
- The Enqueue dialog preselects your agent's queue when it is the only one with an agent, instead of the default queue, which no agent serves.

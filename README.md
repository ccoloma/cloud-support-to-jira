## Description

This tool synchronizes support tickets from Google Cloud to a Jira project. Currently, synchronization is one-way: from Google Cloud to Jira.

### Roadmap

- Support bidirectional sync
- Add support for AWS and Azure support tickets

_Important_: This is not an official Google Cloud product.

## Google Cloud Setup

In order to synchronize your support tickets, this application needs access to the Google Cloud Support API:

- Check that you have at least Enhanced Support on Google Cloud Platform. If you don't have Enhanced Support or higher, the integration will not fail but Google Cloud Support API will always return an empty response.
- Activate the Google Cloud Support API in your [Google Cloud Console](https://console.cloud.google.com/apis/api/cloudsupport.googleapis.com).
- [Create a service account](https://console.cloud.google.com/iam-admin/serviceaccounts) in your Google Cloud project with the 'Tech Support Viewer' role.

## Jira Setup

Create an API token in your [Jira account](https://id.atlassian.com/manage-profile/security/api-tokens) by going to your Jira Account Settings and creating a new API token. This token will be used to authenticate with the Jira API. Tokens have a limited lifetime, so you may need to create a new one periodically.

While creating a new token, set the following scopes:

- `write:jira-work`
- `read:jira-work`

_You cannot use OAuth 2.0 at this moment. OAuth 2.0 currently supports the code grant flow only, it does not support the implicit grant flow. Atlassian is working to fix this ([see the Jira API documentation](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/))._

Keep in mind that scoped and unscoped tokens use different URLs:

- Un-scoped tokens: `https://[mydomain].atlassian.net`
- Scoped tokens: `https://api.atlassian.com/ex/jira/[cloudId]`

Your cloudId can be found in [the support documentation](https://support.atlassian.com/jira/kb/retrieve-my-atlassian-sites-cloud-id/)\_

## Configuration file

Create a configuration file named `config.yaml` in the root directory of the project. Here is an example:

```yaml
source:
  type: google-cloud
  config:
    organizationId: YOUR_ORGANIZATION_ID

target:
  type: jira
  config:
    host: yourproject.atlassian.net
    states:
      STATE_UNSPECIFIED: 'To Do'
      NEW: 'To Do'
      IN_PROGRESS_GOOGLE_SUPPORT: 'In Progress'
      ACTION_REQUIRED: 'In Progress'
      SOLUTION_PROVIDED: 'In Review'
      CLOSED: 'Done'
    priorities:
      PRIORITY_UNSPECIFIED: 'Low'
      P0: 'High'
      P1: 'High'
      P2: 'Medium'
      P3: 'Medium'
      P4: 'Low'

logger: '[GcpSync] [SEVERITY] [TIMESTAMP]'

mapping:
  project.key: YOUR_JIRA_PROJECT_KEY
  summary: '${title}'
  description: '${description}'
  issuetype:
    name: Task
  labels:
    - google-cloud
    - support
rules:
  ignore:
    - 'prop1'
    - 'prop2'
  override:
    - description: 'Overriden descripton: ${description}'
    - labels:
        - '${id}'
        - google-cloud-support
```

- source
  - `type`: The type of the source. At this time, the only value supported is `google-cloud`.
  - `config`: The configuration for the source.
  - `organizationId`: Your Google Cloud Organization ID.
- target
  - `type`: The type of the target. At this time, the only value supported is `jira`.
  - `config`: The configuration for the target.
  - `host`: The URL of your Jira project.
  - The `states` and `priorities` are values set on issues after being created in Jira. They map values from the selected source (Google Cloud) to the selected target (Jira).
- `logger` (optional): A string used as a prefix of any log entry created by the app.
- mapping: The mapping of the fields from our issue model to the target.
- rules
  - `ignore`: A list of fields to ignore when syncing issues.
  - `override`: A list of fields to override when syncing issues.

Where supported, you can use the `${field}` syntax to reference fields from the issue.

### Environment Variables

The project uses the following environment variables to configure the application:

- `JIRA_USERNAME`: Your Jira username
- `JIRA_API_TOKEN`: Your Jira API token
- `STATE_FILE_URL`: Google Cloud Storage URL to the state file where the last sync timestamp is stored.
- `SYNC_LIMIT`: The maximum number of issues to sync in a single run. Default is 200.
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to the service account JSON key file. Optional if you use GKE.

You need to download the credentials for the service account that will be used to connect to the Google Cloud APIs. To do this, download the JSON key file from the Google Cloud web console and set `GOOGLE_APPLICATION_CREDENTIALS` to point to the key file.

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-file.json"
```

## Run the synchronizer

To start synchronizing your Google Cloud issues with Jira, launch the following command:

```bash
docker run -v $(pwd)/.env:/app/.env -v $(pwd)/config.yaml:/app/config.yaml your-image
```

You can also run the project in a local environment by using the following command:

```bash
npm start
```

# Development

## Jira

You can use a free jira account for development, by going to the Jira website and signing up for a free account. Once you have an account, you can create a new project and start using the API.

Add the credentials to the `.env` file:

```.env
JIRA_USERNAME=your-jira-username
JIRA_API_TOKEN=your-jira-api-token
```

## License

This project is released under a **dual license** model:

- **LICENSE.txt**: The public license allows inspection and internal testing only.
- **LICENSE-CHOICE.md**: For any production or commercial use, a commercial license is required.

Please contact [ccescribano@gmail.com](ccescribano@gmail.com) for more information or to obtain a commercial license.

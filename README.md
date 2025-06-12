## License

This project is released under a **dual license** model:

- **LICENSE.txt**: The public license allows inspection and internal testing only.
- **LICENSE-CHOICE.md**: For any production or commercial use, a commercial license is required.

Please contact [ccescribano@gmail.com](ccescribano@gmail.com) for more information or to obtain a commercial license.

## Setup

This project requires to have at least Enhanced Support on Google Cloud Platform, because Google Cloud Support API only works with Enhanced Support or higher. If you don't have Enhanced Support, the project will not fail but the support API will not return nothing at all.

### Activate Google Cloud Support API

You need to activate the Google Cloud Support API in your GCP project. You can do this by going to the [Google Cloud Console](https://console.cloud.google.com/apis/api/cloudsupport.googleapis.com) and enabling the API for your project.

### Create a Service Account

You need to [create a service account](https://console.cloud.google.com/iam-admin/serviceaccounts) in your GCP project with the 'Tech Support Viewer' role.

### Jira Credentials

You need to create an API token in your [Jira account](https://id.atlassian.com/manage-profile/security/api-tokens). You can do this by going to your Jira account settings and creating a new API token. Once you have the token, you can use it to authenticate with the Jira API. Tokens have a limited lifetime, so you may need to create a new one periodically.

- Scopes

You need to set the following scopes for your API token:

- `write:jira-work`
- `read:jira-work`

_You cannot use OAuth 2.0 at this moment. OAuth 2.0 currently supports the code grant flow only. It does not support the implicit grant flow. They are investigating ways to address this. You can look for updates on the [Jira API documentation](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/)._

Scoped tokens and unscoped tokens are different. The REST API is the same but the base URL is different. Scoped tokens use the base URL `https://api.atlassian.com` and unscoped tokens use the base URL `https://your-domain.atlassian.net`.

- Un-scoped tokens: https://mydomain.atlassian.net
- Scoped tokens: https://api.atlassian.com/ex/jira/{cloudId}

_cloudId can be found following [the support documentation](https://support.atlassian.com/jira/kb/retrieve-my-atlassian-sites-cloud-id/)_

## Configuration

### Configuration File

You need to create a configuration file named `config.yaml` in the root directory of the project. Here is an example configuration file:

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
  - `type`: The type of the source. In this case, it is `google-cloud`.
  - `config`: The configuration for the source. You need to set the `organizationId` to your GCP organization ID.
- target
  - `type`: The type of the target. In this case, it is `jira`.
  - `config`: The configuration for the target. You need to set the `host` to your Jira project URL and map the states and priorities to your Jira project. The states and priorities are optional, but they are recommended to ensure that the issues are created with the correct state and priority in Jira. States and priorities depends on the selected source, so you may need to adjust them according to your needs.
- logger (optional)
  - To customize the logger format. It will be used as a prefix of any log done by the app. You can show the severity with 'SEVERITY' and timestamp with 'TIMESTAMP' in the log messages, as well as an app identifier.
- mapping
  - The mapping of the fields from our issue model to the target. You can use the `${field}` syntax to reference fields from the issue.
- rules
  - `ignore`: A list of fields to ignore when syncing issues.
  - `override`: A list of fields to override when syncing issues. You can use the `${field}` syntax to reference fields from the issue.

### GCP Credentials

You need to create a service account in your GCP project and download the JSON key file. You can do this by going to the GCP console, creating a new service account, and downloading the key file. Once you have the key file, you can set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to the key file.

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-file.json"
```

### Environment Variables

The project uses environment variables to configure the application:

- `JIRA_USERNAME`: Your Jira username
- `JIRA_API_TOKEN`: Your Jira API token
- `STATE_FILE_URL`: Google Cloud Storage URL to the state file where the last sync timestamp is stored.
- `SYNC_LIMIT`: The maximum number of issues to sync in a single run. Default is 200.
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to the service account JSON key file. Optional if you use GKE.

# Development

## Jira

You can use a free jira account for development. You can create a new Jira account by going to the Jira website and signing up for a free account. Once you have an account, you can create a new project and start using the API.

Add the credentials to the `.env` file:

```.env
JIRA_USERNAME=your-jira-username
JIRA_API_TOKEN=your-jira-api-token
```

## Run the project

You can run the project by using the following command:

```bash
docker run -v $(pwd)/.env:/app/.env -v $(pwd)/config.yaml:/app/config.yaml your-image
```

You can also run the project in a local environment by using the following command:

```bash
npm start
```

# Automatic Google Meet links (optional)

Without this setup, the doctor creates a link at <https://meet.google.com/new>, pastes it into the
consultation's **Meet link** field in admin, saves, and clicks **Approve & send link**.

With this setup, clicking **Approve & generate Meet link** creates a Google Calendar event on the doctor's
calendar with a Meet link attached. It takes about 10 minutes, once.

1. Go to <https://console.cloud.google.com/> and create a project, e.g. "Pareena Website".
2. **APIs & Services → Library**: enable the **Google Calendar API**.
3. **OAuth consent screen**: choose External, fill in the app name and support email, and add the scope
   `https://www.googleapis.com/auth/calendar.events`. Add the doctor's Gmail as a test user, then
   **Publish app** so the token doesn't expire after 7 days.
4. **Credentials → Create credentials → OAuth client ID**, type **Web application**, and add the authorised
   redirect URI `https://developers.google.com/oauthplayground`. Copy the **Client ID** and **Client secret**.
5. Open <https://developers.google.com/oauthplayground>:
   - Click the gear icon, tick **Use your own OAuth credentials**, and paste the client ID and secret.
   - In Step 1, enter the scope `https://www.googleapis.com/auth/calendar.events` and click **Authorize APIs**. Sign in as the doctor.
   - In Step 2, click **Exchange authorization code for tokens** and copy the **Refresh token**.
6. Set these on the backend:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REFRESH_TOKEN=...
   GOOGLE_CALENDAR_ID=primary
   ```

Set **Scheduled for** on the request before approving. If it's empty, the event is placed 30 minutes from now.

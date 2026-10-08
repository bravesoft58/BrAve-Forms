# Setting up BrAve Forms email alerts in Microsoft 365

**For:** the customer's Microsoft 365 administrator (Q&D: Andy Breen)
**Created:** 2026-10-08
**Last Updated:** 2026-10-08T16:17:29Z
**Status:** DRAFT. The in-app settings page this sheet points to ships with BF-74.

BrAve Forms sends alert emails, starting with "Visible sheen/plume reported", from a mailbox in **your** Microsoft 365. Nothing goes through an outside email service. You create three things in Microsoft 365, then paste five values into BrAve Forms.

The app is limited to sending from that one mailbox. It cannot read any mail, and it cannot send as anyone else.

**Time needed:** about 30 minutes, plus up to 2 hours for Microsoft to apply the permission.
**You need:** Exchange Administrator in Microsoft Entra ID and membership of the Exchange **Organization Management** role group, plus the Exchange Online PowerShell module.

---

## Step 1: Create the alerts mailbox

Use a **shared mailbox**: it needs no license.

1. Exchange admin center, **Recipients**, **Mailboxes**, **Add a shared mailbox**.
2. Display name: `BrAve Forms Alerts`. Email address: `forms-alerts@qdconstruction.com`.
3. You do not need to add members. Nobody signs in to it; it only sends.

Write down: **sender mailbox address**.

## Step 2: Register the app in Microsoft Entra ID

1. Microsoft Entra admin center, **Identity**, **Applications**, **App registrations**, **New registration**.
2. Name: `BrAve Forms`. Supported account types: **Accounts in this organizational directory only**. Redirect URI: leave empty. **Register**.
3. **Certificates & secrets**, **Client secrets**, **New client secret**. Description `BrAve Forms alerts`. Choose an expiry your security policy allows. **Copy the secret Value now**: it is shown once.

**Important: do not add or grant the `Mail.Send` API permission on this app.** Granting it in Entra lets the app send as *every* mailbox in your company, and Step 3's restriction cannot narrow it. Microsoft documents this: the Entra grant and the Exchange grant add together. Step 3 gives the app the permission for the one mailbox only.

Write down:
- **Directory (tenant) ID** (Overview page)
- **Application (client) ID** (Overview page)
- **Client secret value** (from step 3 above)
- **Secret expiry date**

## Step 3: Allow the app to send from that one mailbox only

This uses Exchange "RBAC for Applications": role-based access control that limits an app to named mailboxes.

First find the app's **Enterprise application** IDs. Go to Microsoft Entra admin center, **Enterprise applications**, open **BrAve Forms**, and copy **Application ID** and **Object ID** from this page. Microsoft notes that the App registrations page shows a *different* Object ID; use the Enterprise applications one.

Then in PowerShell (replace the placeholders):

```powershell
Connect-ExchangeOnline

# 1. Tell Exchange about the app (IDs from the Enterprise applications page)
New-ServicePrincipal -AppId <Application ID> -ObjectId <Object ID> -DisplayName "BrAve Forms"

# 2. A scope containing only the alerts mailbox
New-ManagementScope -Name "BrAve Forms alerts mailbox" -RecipientRestrictionFilter "PrimarySmtpAddress -eq 'forms-alerts@qdconstruction.com'"

# 3. Send permission, limited to that scope
New-ManagementRoleAssignment -App <Application ID> -Role "Application Mail.Send" -CustomResourceScope "BrAve Forms alerts mailbox"
```

## Step 4: Check the restriction

```powershell
# Should show InScope = True
Test-ServicePrincipalAuthorization -Identity <Application ID> -Resource forms-alerts@qdconstruction.com

# Any other mailbox should show InScope = False
Test-ServicePrincipalAuthorization -Identity <Application ID> -Resource <your own address>
```

Also confirm in Entra, **App registrations**, **BrAve Forms**, **API permissions** that `Mail.Send` is **not** listed with admin consent.

Microsoft applies permission changes after 30 minutes to 2 hours. The test command above is immediate; real sending may fail until then.

## Step 5: Enter the values in BrAve Forms

Sign in as an organization admin, open **Settings**, **Email alerts (Microsoft 365)**, and enter:

| BrAve Forms field | Value |
|---|---|
| Tenant ID | Directory (tenant) ID from Step 2 |
| Client ID | Application (client) ID from Step 2 |
| Sender mailbox | the address from Step 1 |
| Client secret | the secret value from Step 2 |
| Secret expires on | the expiry date from Step 2 |

Click **Send test email**. It goes to your own address from the alerts mailbox. If it fails, the page says why. If the error mentions permission, wait up to two hours after Step 3 and try again.

BrAve Forms stores the secret encrypted and never shows it again. To replace it, paste a new one; leaving the box empty keeps the current one.

## Step 6: Set each project's waterway contact

On each project with a Waterway NDEP permit, **Edit project**, **Waterway Contact**: the name, phone and email of the person to call on a visible sheen or plume. The phone shows on the inspection form; the email receives the alert.

---

## When the secret expires

BrAve Forms warns organization admins 30 days before the date you entered. To renew: create a new client secret on the same app registration (Step 2.3), paste it into BrAve Forms with its new expiry date, send a test email, then delete the old secret in Entra.

## To remove access

Delete the **BrAve Forms** app registration in Entra. Microsoft removes its Exchange permission automatically. Then clear the settings in BrAve Forms.

## Sources

- Microsoft Learn, "Role Based Access Control for Applications in Exchange Online" (page updated 2026-08-21, checked 2026-10-08): https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac
- Microsoft Exchange Team blog, SMTP AUTH Basic authentication timeline (checked 2026-10-08): https://techcommunity.microsoft.com/blog/exchange/updated-exchange-online-smtp-auth-basic-authentication-deprecation-timeline/4489835. This is why BrAve Forms does not use an SMTP username and password.

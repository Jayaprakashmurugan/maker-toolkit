---
title: "Power Apps Deep Links: Email Direct Link to A Specific Screen with Specific Record Prefilled"
description: "Deep links play a pivotal role in enhancing user experience within applications. In Power Apps, these deep links become particularly powerful when integrated…"
date: 2023-12-26
tags: [Power Apps, Deep links, Email]
source:
  name: Medium
  url: https://jayaprakashmurugan.medium.com/power-apps-deep-links-email-direct-link-to-a-specific-screen-with-specific-record-prefilled-a37580e7a9fa
---

Deep links play a pivotal role in enhancing user experience within applications. In Power Apps, these deep links become particularly powerful when integrated into emails. Imagine being able to guide your app users directly to a specific record or screen with a simple click. In this article, we’ll go through the process of creating and utilizing deep links in Power Apps to seamlessly connect our users with the information they need.

**Understanding Deep Links in Power Apps:**

Deep links, as the name suggests, are hyperlinks designed to navigate users directly to a specific section or record within an application. In Power Apps, this functionality becomes invaluable when shared through emails. Recipients can effortlessly open the app and land precisely where they need to be without any additional steps.

**How to Create Deep Links in Power Apps:**

***Step 1: Identify the Target Record or Screen***\
Before crafting the deep link, determine the specific record or screen within your Power App that you want the user to land on. This could be a particular customer profile, an order form, or any other significant data point. In our case, we’ll use a practical example from a project where app users share product matches with colleagues, prefilling details for a seamless experience.

***Step 2: Generate the Deep Link***\
Power Apps makes it relatively straightforward to generate deep links. Navigate to the target screen or record and look for the option to create a deep link. This is often found in the settings or properties of the specific element. Additionally, ensure you pass relevant parameters, such as matchId, to specify which record is targeted.

***Step 3: Incorporate the Deep Link into an Email***\
Compose your email as usual, and when you reach the point where you want to include the deep link, insert it as a hyperlink. Ensure that the link is clearly labeled, indicating to the recipient where it will lead. In our example, we utilized the Office365Outlook.SendEmailV2 connector to seamlessly integrate the deep link into the email.

```powerfx
Office365Outlook.SendEmailV2(
 User().Email,
 "➕ Exciting news: Your perfect product match is waiting for you!",
 $"Hello User <br>
 We have discovered a new product that is perfectly tailored to your preferences! Here is a match link: <br><br>
 <a href='{gblAppLink}&matchId={gblSelectedMatch.matches}'> 📅 Open your match </a> <br><br>
 Click on the link above to find out the details of your perfectly customized product."
);
```

***Step 4: Testing the Deep Link***\
Before sending the email, conduct thorough testing. Click on the deep link from the email to confirm that it accurately directs users to the intended record or screen within the Power App.

**Best Practices for Using Deep Links in Power Apps:**\
*1. Clear Labeling:* Clearly label your deep links in emails so that recipients understand where the link will take them.

*2. Security Considerations:* Ensure that the deep links don’t compromise security. Validate user permissions to access the specified records or screens.

**Conclusion:**\
Incorporating deep links into our Power Apps emails can significantly enhance user efficiency and satisfaction. By following these steps and best practices, we can seamlessly guide our users to the precise information they need, making the overall experience more intuitive and user-friendly.

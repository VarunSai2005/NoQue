CafeteriaUI — Static Frontend (HTML/CSS/JS)

Files:
- index.html — Menu / Home
- cart.html — Cart & checkout (shows token popup)
- login.html — Login page
- signup.html — Signup page (choose role 'admin' to create admin)
- admin.html — Admin panel to add/edit/delete menu items (requires admin login)
- styles.css — Top-notch warm cafeteria styling
- js/common.js — Shared JavaScript for all pages
- logo192.png — small placeholder image

LocalStorage keys used:
- caf_menu_v1
- caf_users_v1
- caf_orders_v1
- caf_cart_v1
- caf_user

How to use:
Open index.html in a browser. Signup for user or admin. Admin can edit menu items. Place orders from the cart — a pickup token will be generated and can be copied.

Deploy:
This is a static site — you can deploy to Vercel by creating a new project and pointing to this folder (or push to GitHub and connect from Vercel).
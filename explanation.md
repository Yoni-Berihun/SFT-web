# Project Code Analysis and Explanation

This document provides a detailed educational breakdown of every HTML, CSS, and JavaScript file in the project.

---

## about.html

### Purpose & Role
The `about.html` file serves as the primary informational page for the EduFinance application. Its role is to clearly communicate the project's identity, mission, and value proposition to new users, potential collaborators, and stakeholders. Unlike the functional dashboard pages, this page is static and marketing-oriented, designed to build trust and provide context about the "Hawassa-born project." It bridges the gap between a simple utility and a community-driven initiative by highlighting the educational philosophy ("Built for students, shaped by educators") behind the code.

### Structure & Sections
The file follows a semantic HTML5 structure, ensuring accessibility and SEO friendliness.

1.  **Head Section (`<head>`)**:
    *   **Meta Tags**: Defines character set (`utf-8`) and viewport settings for responsiveness.
    *   **Typography**: Preconnects to Google Fonts and loads the "Inter" font family, establishing the modern, clean aesthetic of the brand.
    *   **Stylesheets**: Links `global.css` for core variables and layout, `about.css` for page-specific styling, and `about-animations.css` for visual flair.
    *   **Scripts**: Defers the loading of `common.js` (shared interaction logic) and `about.js` (page-specific behavior) to ensure the DOM is ready before scripts run.

2.  **Header (`<header>`)**:
    *   Contains the navigation bar with the logo (`.brand`), mobile toggle button (`.nav-toggle`), and the primary navigation links.
    *   Includes the theme toggle button (Sun/Moon icon) and a "Login" call-to-action (CTA).
    *   **Accessibility**: Uses `aria-label`, `aria-expanded`, and `role="banner"` to support screen readers.

3.  **Main Content (`<main id="main-content">`)**:
    *   **Hero Section (`.about-hero`)**: The visual anchor of the page. It features an "eyebrow" text ("Hawassa-born project"), a main heading (`<h1>`), and a descriptive subtitle. It includes primary action buttons ("Join community call", "Contact us") and a decorative "orbit" animation element.
    *   **Mission & Vision (`.about-panels`)**: Two side-by-side `<article>` cards that contrast the "Mission" (Demystify finance) with the "Vision" (Curriculum-ready building blocks).
    *   **Pillars Section (`.about-pillars`)**: A grid layout detailing the three core differentiators: "Learning-first flows," "Visual explainers," and "Community governance."
    *   **Call to Action (`.about-cta`)**: A final section encouraging user engagement, providing specific contact details and links to the GitHub Wiki/Resource hub.

4.  **Footer (`<footer>`)**: A simple copyright notice (`.site-footer`), grounding the page.

5.  **Interactive Overlays**:
    *   **Modal (`#modalOverlay`)**: A hidden shell for displaying community info.
    *   **Toast (`#toast`)**: A notification bubble for system messages (e.g., "Ready").

### Logic & Functionality
While primarily static, the page relies on specific logic:
*   **Navigation Active State**: The `data-page="about"` attribute on the `<body>` tag allows scripts to highlight the active link in the navigation bar automatically.
*   **Theme Toggling**: The SVG icon in the header switches between sun and moon states based on the active theme (controlled by `common.js`).
*   **CSS Animations**: The `.about-hero__orbit` div likely contains pure CSS animations (defined in `about-animations.css`) to create a rotating or pulsing visual effect, adding dynamism without JavaScript overhead.
*   **Smooth Scrolling**: Anchors like `href="#contact"` utilize browser-native smooth scrolling behavior (often defined in `global.css` with `scroll-behavior: smooth`).

### Connections
*   **Styles**: Heavily dependent on `css/global.css` for the design system (colors, typography, container widths) and `css/about.css` for the specific grid layouts of the panels and pillars.
*   **Scripts**: Interfaces with `js/common.js` for the mobile menu and theme logic. The specific `js/about.js` likely handles specific animations or interactions unique to this page.
*   **Navigation**: Links to all major app sections (`dashboard.html`, `expenses.html`, etc.), acting as a hub.

### Best Practices & Improvements
*   **Strengths**:
    *   **Semantic HTML**: Excellent use of `<article>`, `<section>`, `<header>`, and `<main>` tags. This improves machine readability.
    *   **Accessibility**: Strong focus on ARIA attributes (`aria-label`, `aria-controls`) and "skip-link" functionality for keyboard users.
    *   **Performance**: Font pre-connections and deferred scripts are performance wins.
*   **Improvements**:
    *   **Hardcoded Styles**: Inline styles (e.g., `style="background-color: #10b981..."`) on the hero buttons should be moved to CSS classes to maintain separation of concerns and simpler theming.
    *   **Content Redundancy**: The `aria-label="EduFinance home"` on the logo is good, but the visual text "EduFinance" is also present. Ensure screen readers don't announce it redundantly.

### Teaching Style: Q&A
**Q: Why do we use `data-page="about"` on the body?**
A: This is a "hook" for our JavaScript. It allows our logic to ask "Which page am I on?" without parsing the URL string. We can easily select the active navigation link and add an `.active` class to it.

**Q: What is the purpose of `role="banner"` on the header?**
A: This is an ARIA landmark role. It explicitly tells assistive technologies that this section contains site-oriented content (like the logo and global nav), distinct from the main page content.

---

## abouts.html

### Purpose & Role
The `abouts.html` file appears to be an alternative or updated version of the "About" page. While `about.html` focuses on the *project structure and pillars*, `abouts.html` focuses more on the *human element, values, and the team*. It is likely designed to humanize the application, showcasing the student/educator collaboration explicitly and listing core values like "Easy to Use" and "Honest & Clear." It plays a crucial role in building emotional connection and trust with the user base.

### Structure & Sections
The file uses a modular section-based architecture:

1.  **Head & Meta**: Similar to other pages but includes a specific meta description for SEO: "Learn about the EduFinance team...".
2.  **Navigation**: Identical structure to `about.html`, maintaining consistency.
3.  **Hero Section (`.abouts-hero`)**: A simpler, centered hero section focusing on "Empowering Students."
4.  **Values Grid (`.abouts-values`)**:
    *   A section highlighting 4 core values using SVG icons.
    *   Uses a CSS Grid or Flexbox layout (`.values-grid`) to display cards side-by-side.
    *   **SVG Icons**: The SVGs are inline, allowing for direct CSS styling (like `currentColor` fill/stroke) based on the theme.
5.  **Team Grid (`.abouts-team`)**:
    *   Displays team members ("Development Team", "Design Team", "Education Team").
    *   Uses abstract SVG avatars instead of real photos, preserving privacy while adding character.
6.  **Mission Section (`.abouts-mission`)**:
    *   A detailed text block explaining the "Why" behind the project.
    *   Includes a "Stats" bar (`.mission-stats`) showing "50 Students," "100% Free," etc., providing social proof.
7.  **Contact Section (`.abouts-contact`)**: Provides explicit email and location details with associated icons.

### Logic & Functionality
*   **Theme Awareness**: The inline SVGs use `stroke="currentColor"`. This means they will automatically adapt their color when the text color changes (e.g., switching from light to dark mode). This is a powerful, low-maintenance way to handle icons.
*   **Initialization Script**:
    ```javascript
    document.addEventListener('DOMContentLoaded', function() {
        if (window.App) { ... }
    });
    ```
    Unlike `about.html`, this file includes an inline script block at the bottom to explicitly initialize the `App` object. This suggests it might be a newer refactor or testing a different initialization pattern.
*   **Component Reuse**: The navigation and footer are identical to other pages, reinforcing the "Shell" concept where the outer frame remains constant while the inner content changes.

### Connections
*   **CSS**: Links to `css/abouts.css` (note the 's'). This indicates a separate stylesheet from `about.css`, confirming these are distinct page variations.
*   **Assets**: Doesn't load external images but relies heavily on inline SVG code. This reduces HTTP requests, making the page load faster.

### Best Practices & Improvements
*   **Strengths**:
    *   **Inline SVGs**: Embedding SVGs directly allows for superior styling control and performance (no extra network request) compared to `<img>` tags.
    *   **Descriptive Content**: The copy is well-written and empathetic ("Let's be honest—managing money..."), which is excellent for UX writing.
*   **Improvements**:
    *   **File Naming**: The name `abouts.html` is confusing alongside `about.html`. A better name might be `team.html`, `mission.html`, or simply replacing `about.html` if this is the new version.
    *   **Code Duplication**: The "Values" and "Team" cards repeat a lot of HTML structure. In a templated environment (like React or PHP), these would be loops. In static HTML, it's fine but verbose.

### Teaching Style: Q&A
**Q: Why are SVGs "inline" here?**
A: Inline SVG means the `<svg>` code is pasted directly into the HTML file rather than referenced via an `<img src="...">` tag. This lets us use CSS to change the icon's color (`fill`, `stroke`) dynamically when the user toggles dark mode, which isn't possible with standard image tags.

**Q: What is the `currentColor` value in CSS/SVG?**
A: `currentColor` is a special CSS variable that refers to the current text color of the element (or its parent). If you set `color: red;` on a div, any SVG inside it with `stroke="currentColor"` will instantly turn red. It's magic for theming!

---

## analysis.html

### Purpose & Role
`analysis.html` is the data visualization powerhouse of the application. Its purpose is to transform raw financial data into actionable insights. It allows users to query their expense history using filters (Date Range, Category) and view the results through interactive charts and summary statistics. This page transforms the user from a passive data entrant to an active analyst of their own finances.

### Structure & Sections
This is a "Dashboard" class page, structured as a web application interface rather than a document.

1.  **Dependencies**:
    *   Loads **Chart.js** (for graphing), **jspdf** (for PDF export), and the full **Firebase SDK suite** (App, Auth, Firestore).
    *   Note: Firebase scripts are loaded synchronously here, which might block rendering slightly but ensures they are available immediately for data fetching.

2.  **Controls Section (`.analysis-controls`)**:
    *   A form-like bar containing `<select>` dropdowns for "Date range" and "Category," and `<input type="date">` fields for custom ranges.
    *   This is the "Control Panel" that drives the logic of the rest of the page.

3.  **Summary Cards (`.analysis-summary`)**:
    *   Three key metric cards: "Total spent," "Average daily," and "Biggest category."
    *   These act as the "Headline" figures for the selected period.

4.  **Charts Section (`.analysis-charts`)**:
    *   **Daily Flow**: A canvas element (`#analysisDailyChartCanvas`) for a Bar/Line combo chart showing spending trends.
    *   **Category Breakdown**: A canvas (`#analysisCategoryChartCanvas`) for a Doughnut chart showing distribution.
    *   Includes a text-based legend/list (`#analysisCategoryList`) for accessibility and detail.

5.  **Log Section (`.analysis-log`)**:
    *   A detailed list/table of specific transactions that match the current filters, allowing users to drill down from the aggregate chart data to specific line items.

### Logic & Functionality
*   **Interactive Filtering**: The page listens for `change` events on the inputs. When a user changes the date from "7 days" to "30 days," Javascript (`js/analysis.js`) triggers a re-query of the database, re-calculates the stats, and updates the charts without reloading the page.
*   **Canvas Rendering**: The `<canvas>` elements are empty containers. The `Chart.js` library draws the pixels onto them based on data arrays provided by the application logic.
*   **Export Logic**: Buttons for "Export PDF" and "Export CSV" suggest that the page can gather the current data context and generate downloadable files—a complex client-side operation.
*   **Firebase Integration**: This page likely performs complex Firestore queries (e.g., `where('date', '>=', startDate)`) to fetch only relevant data, optimizing bandwidth.

### Connections
*   **`js/analysis.js`**: The brain of this page. It connects the HTML inputs to the chart rendering logic.
*   **`js/charts.js`**: Likely a helper file containing the configuration for the Chart.js instances (colors, axes, tooltips) to keep the main logic file clean.
*   **`js/firebase-config.js`**: Essential for connecting to the backend database.

### Best Practices & Improvements
*   **Strengths**:
    *   **Progressive Loading**: The charts use specific ID targets, allowing the script to precisely inject content where needed.
    *   **Grid Layout**: The CSS classes (implied `page-grid`, `chart-card--wide`) suggest a robust CSS Grid layout that handles the complex spacing of a dashboard well.
*   **Improvements**:
    *   **Script Loading**: Loading Firebase synchronously in the `<head>` (`<script src="...">`) can slow down the initial display of the page. It's usually better to `defer` these or load them closer to the body close tag, unless the app serves no purpose without them (which might be true here).
    *   **Empty States**: The `#analysisTopCategoryShare` starts with "Waiting for data." It's important to ensure this updates gracefully if there is *no* data (e.g., "No expenses found").

### Teaching Style: Q&A
**Q: What is a `<canvas>` element?**
A: Think of it as a blank digital whiteboard. By itself, it has no content. JavaScript acts as the artist, drawing lines, shapes, and text onto it pixel-by-pixel. That's how `Chart.js` creates those beautiful graphs—it draws them!

---

## dashboard.html

### Purpose & Role
The `dashboard.html` file acts as the mission control for the authenticated user. Its primary purpose is to provide an "at-a-glance" summary of the user's financial health. It aggregates data from various modules (expenses, budgets) to answer three critical questions: "How much have I spent?", "Am I on track?", and "What do I need to pay next?". It serves as the default landing page after login, routing the user to more detailed views like Expenses or Analysis when deeper investigation is needed.

### Structure & Sections
The file handles a high density of information using a card-based layout:

1.  **Header (`<header>`)**:
    *   Standard app shell navigation.
    *   Includes a `logout` button, critical for session management.

2.  **Date Controls (`.section-header`)**:
    *   **Greeting**: Personalizes the experience (`<span data-key="userName">`).
    *   **Toggles**: A "pill" toggle switch allows users to instantly pivot the entire dashboard's data scope between "This Week" and "This Month." This is a key UX pattern for financial apps.
    *   **Custom Range**: A hidden set of date inputs (`.date-range-custom`) that can be revealed for precise filtering.

3.  **Hero Metrics (`.dashboard-hero`)**:
    *   **Metric Card**: A massive, central card displaying the "Spending snapshot."
    *   **Sparklines**: Small `<span>` elements with `data-sparkline` attributes. These are intended to be miniature, word-sized charts that show trends (e.g., up/down) inline with the text.
    *   **Progress Bar**: A visual budget meter (`.progress-bar`) that fills up as the user spends money, providing immediate visual feedback on budget exhaustion.

4.  **Insights & Tables**:
    *   **Expenses Section**: A preview of the latest transactions (top 5 usually), inviting the user to "View all."
    *   **Tips Section**: A grid (`#tipsList`) where dynamic financial advice cards are injected.
    *   **Reminders**: A dedicated card for upcoming bills ("Pay library fine"), acting as a to-do list.

5.  **Modals**:
    *   **Add Expense**: A fully accessible dialog (`role="dialog"`) for quick data entry without leaving the dashboard.
    *   **Add Reminder**: A secondary modal for creating new reminder tasks.
    *   **Toasts**: Hidden notification elements (`#toast`) for feedback like "Saved."

### Logic & Functionality
*   **Data Binding**: The HTML makes heavy use of `data-key` attributes (e.g., `data-key="totalSpent"`). This indicates a "View-Model" pattern in the JavaScript (`dashboard.js`), where the script fetches data and automatically injects it into any element with the matching key, separating the UI structure from the data values.
*   **State Management**: The "Week/Month" toggle updates a state variable in JS, which triggers a re-fetch and re-render of all the metrics on the page seamlessly.
*   **Event Delegation**: The tables likely use event delegation for "Delete" or "Edit" actions, where a single event listener on the parent table handles clicks for all rows.

### Connections
*   **`dashboard.js`**: Controls the logic, ensuring the "Hello, Student" text is replaced with the real name and the numbers are calculated correctly.
*   **`tips.html` / `reminders`**: While concepts, these sections are integrated directly here.
*   **CSS**: Uses `dashboard.css` for the specific card layouts and `theme.css` for consistent spacing and colors.

### Best Practices & Improvements
*   **Strengths**:
    *   **ARIA Roles**: Uses `role="tablist"` and `aria-selected` for the date toggles. This tells screen reader users that these buttons define the view context, behaving like tabs.
    *   **Modular Modals**: Placing modals at the bottom of the `<body>` prevents z-index stacking context issues and is a standard implementation practice.
*   **Improvements**:
    *   **Empty States**: If a user has no data, the graph placeholders or "Recent transactions" might look broken. The HTML structure should account for "Zero Data" states (e.g., "No transactions yet—add your first one!").
    *   **Performance**: The PDF libraries (`jspdf`) are loaded in the head. If PDF export is rarely used, dynamically importing this library only when the button is clicked would save bandwidth.

### Teaching Style: Q&A
**Q: What is a "Sparkline"?**
A: A sparkline is a "data-word"—a tiny chart small enough to fit in a line of text. It gives context (is the trend going up or down?) without the heavy weight of a full chart axis or legend.

**Q: Why use `data-key` instead of `id` for data?**
A: IDs must be unique. If we wanted to show the "Total Spent" in two places (header and footer), IDs wouldn't work. `data-key="totalSpent"` allows our instruction "Find everyone who needs 'totalSpent' and update them" to work on multiple elements at once.

---

## expenses.html

### Purpose & Role
`expenses.html` is the "Workhorse" page. While the dashboard is for monitoring, `expenses.html` is for management. It provides a full Create, Read, Update, Delete (CRUD) interface for the user's transaction history. It allows for deep dives into spending habits through categories, searching, and filtering.

### Structure & Sections
This page combines high-level insights with granular data management.

1.  **Hero (`.page-hero--expenses`)**:
    *   Features a dedicated "Add expense" primary button (FAB or Header action).
    *   **Metric Glace**: Immediately shows totals (`#expensesTotal`) for the specific filtered view, confirming the filter's effect.

2.  **Highlights & Charts**:
    *   **Budget Health**: A visual bar showing percentage used vs. remaining.
    *   **Insights Grid**: Three specific visualization cards:
        *   **Donut Chart**: Category Share (Food vs Transport).
        *   **Pulse Chart**: An inline SVG chart showing spending "momentum" (daily spikes).
        *   **Timeline**: A text-based list of upcoming bills.

3.  **Transaction Table (`.expenses-table`)**:
    *   The core component. A structured table (using `div`s with CSS Grid/Flexbox rather than `<table>` tags for responsive control) listing Date, Category, Amount, Notes, and Actions.
    *   **Pagination/Scrolling**: Implied by the layout, supporting long lists of data.

4.  **Add Expense Modal**:
    *   A form collecting strict data types: `input type="date"`, `input type="number"`, and a `<select>` for normalized categories.

### Logic & Functionality
*   **Form Validation**: The standard `required`, `min="0"`, and `step="0.01"` attributes on inputs enforce data integrity before the JavaScript ever sees the data.
*   **SVG Charts**: The "Pulse" chart uses raw SVG paths (`<path d="...">`). This is likely generated dynamically by JavaScript based on the data points, or it's a static placeholder manipulated by CSS.
*   **Filtering**: The generic "Filter by category" dropdown connects to the table renderer. Selecting "Food" hides all non-food rows, likely via DOM manipulation or re-rendering the array.

### Connections
*   **`expenses.js`**: Handles the fetching of the full collection from Firestore.
*   **`charts.js`**: Powers the donut chart rendering.
*   **Global Variables**: Relies on defined categories (Food, Transport, etc.) that must match across the system (Validation logic in JS).

### Best Practices & Improvements
*   **Strengths**:
    *   **Semantic Forms**: Good use of `<label>` wrapping inputs or using `for` attributes. This increases clickable area and accessibility.
    *   **Responsive Tables**: Using `div` structures allows the table to potentially stack into cards on mobile, which is much harder with native `<table>` elements.
*   **Improvements**:
    *   **Hardcoded Categories**: The `<select>` options are hardcoded in HTML. If the app adds a new category "Health," it must be updated in every HTML file. Generating these options via JavaScript from a single config file would be more maintainable.
    *   **Chart Accessibility**: The `<canvas>` has `aria-label`, which is good, but providing a text-based summary or a table alternative for screen readers is a "Gold Standard" accessible pattern.

### Teaching Style: Q&A
**Q: Why use `input type="number"` with `step="0.01"`?**
A: `type="number"` brings up the numeric keypad on mobile. `step="0.01"` allows the user to enter decimals (cents). Without `step`, the browser might validate "12.50" as an error because it expects integers by default.

**Q: What is a "CRUD" interface?**
A: It stands for Create, Read, Update, Delete. It's the four basic functions most interactions with a database require. `expenses.html` lets you **Create** a new expense, **Read** the list, **Update** (implied) details, and **Delete** mistakes.

---

## index.html

### Purpose & Role
`index.html` is the public face of EduFinance. It is a **Landing Page** designed to convert visitors into users. Unlike the app pages which frame functionality, this page tells a story ("Track, Learn, Grow"), showcases social proof ("95% Happy Users"), and highlights the unique value propositions to encourage the "Get Started" click.

### Structure & Sections
It is a "One-Pager" design, aggregating content that is split across other pages (like `abouts.html`) into a single, cohesive narrative flow.

1.  **Hero (`#home`)**:
    *   **Value Prop**: Strong headline and subtitle.
    *   **Visual Proof**: A "Hero Card" (`.hero__preview`) that simulates the UI (a fake dashboard card) so users know what the product looks like without signing up.

2.  **Stats Bar (`#stats`)**:
    *   A row of credibility indicators ("10x Faster," "100% Encrypted") to build trust.

3.  **About/Mission (`#abouts`)**:
    *   Reuses the content from `abouts.html` (Mission, Values, Team).
    *   Standard "Z-pattern" or grid layouts to break up text walls.

4.  **Navigation**:
    *   Uses anchor links (`href="#home"`, `href="#abouts"`) to navigate within the page rather than loading new pages (Single Page feel).

### Logic & Functionality
*   **Scroll Spy**: The navigation likely has logic (in `index.js`) to highlight "About" when the user scrolls down to that section.
*   **Shared Assets**: It imports `abouts.css` and `about-overlay.css`, showing that the codebase reuses CSS modules to keep the landing page consistent with the inner "About" page.

### Connections
*   **`login.html`**: The primary exit point. The "Get Started" and "Login" buttons funnel traffic there.
*   **`index.js`**: Likely handles simple animations or the mobile menu toggle for the public site.

### Best Practices & Improvements
*   **Strengths**:
    *   **SEO**: Includes `<meta name="description">`, which is critical for search engines to understand and rank the page.
    *   **Performance**: Use of modern image formats (SVG) and separate CSS files allows critical "first paint" styling to load quickly.
*   **Improvements**:
    *   **Canonical Content**: Since `index.html` and `abouts.html` share so much content (the entire Mission/Team sections), there effectively exists duplicate content. For SEO, it's better to have one canonical source. If `index.html` is the main entry, `abouts.html` might not be indexed or needed in its current form.

### Teaching Style: Q&A
**Q: What is a "Call to Action" (CTA)?**
A: It's the button that tells the user what to do next. "Get Started" is the primary CTA here. It's designed to be the most visually prominent element to guide the user's journey.

**Q: Why use "Anchor Links" (`#id`)?**
A: They tell the browser "Don't go to a new server page, just jump down to the element with this ID on the current page." It makes the site feel fast and fluid.

---

## login.html

### Purpose & Role
`login.html` is the secure gateway to the application. Its role is simple but critical: authenticate existing users. It serves as the barrier between public access and private financial data. It also handles the "Forgot Password" flow (implied or linked) and redirection to the Signup page for new visitors.

### Structure & Sections
Designed for focus, this page minimizes distractions.

1.  **Auth Card**:
    *   Centered layout to focus attention.
    *   **Input Fields**: Email and Password.
    *   **Action Row**: "Remember me" checkbox.
    *   **Submit Button**: Primary action.
    *   **Switch Link**: "Don't have an account? Sign up."

2.  **Feedback Elements**:
    *   `#loginMessage`: A dedicated `div` with `role="alert"`. This is where errors like "Wrong password" or "User not found" appear. Using `role="alert"` ensures screen readers announce these errors immediately.

### Logic & Functionality
*   **Validation**: The `<form>` tag has the `novalidate` attribute. This tells the browser *not* to use its default error bubbles (which are often ugly and inconsistent). Instead, the JavaScript (`login.js`) intercepts the submit event, checks validity manually, and displays custom, styled error messages.
*   **Session Persistence**: The "Remember me" checkbox likely toggles the Firebase Auth persistence mode between `SESSION` (cleared on close) and `LOCAL` (kept forever).

### Connections
*   **`login.js`**: Connects to `auth.js` helper functions to trigger `signInWithEmailAndPassword`.
*   **`firebase-config.js`**: Required to initialize the Auth instance.

### Best Practices & Improvements
*   **Strengths**:
    *   **Autocomplete Attributes**: Uses `autocomplete="email"` and `autocomplete="current-password"`. This is a crucial best practice. It helps password managers (like LastPass or Chrome) autofill the form correctly, reducing friction for the user.
    *   **Footer Links**: Keeps utility links (Contact/GitHub) accessible even outside the app.
*   **Improvements**:
    *   **Password Visibility**: A standard modern feature is a "Show Password" eye icon. This helps users correct typos on mobile devices where typing complex passwords is hard. This feature is currently missing.

### Teaching Style: Q&A
**Q: Why is `novalidate` used on the form?**
A: By default, if you put `required` on an input, the browser blocks the form submit and shows a generic popup. `novalidate` creates a "gentlemen's agreement": "Browser, you stay quiet, I'll handle the validation errors myself in JavaScript so they match my website's theme."

---

## profile.html

### Purpose & Role
`profile.html` is the user's identity center. It goes beyond just "Settings." It acts as a secondary dashboard for "Student Status," showing academic info (ID, Major) alongside financial settings (Currency, Budget). It allows users to control their data privacy (export/delete) and security (password/2FA), making it the compliance hub of the app.

### Structure & Sections
1.  **Identity Hero (`.profile-hero`)**:
    *   Visual avatar (initials) and key academic data (Major, Semester).
    *   **Metadata**: Displays the "Student ID" prominent, which is relevant for a university context.

2.  **Financial Overview**:
    *   A unique set of cards not found on the main dashboard: "Outstanding dues," "Financial aid." This suggests the app might integrate with university billing systems in the future.

3.  **Settings Form (`#profileForm`)**:
    *   The largest form in the app. Edits Name, Email, Major, Semester, and Budget.
    *   **Currency Picker**: Allows users to switch between ETB, USD, etc.

4.  **Security & Data Zone**:
    *   **Danger Zone**: A distinct section (red styling implied) for "Clear all data," following the pattern of making destructive actions visually distinct.
    *   **Export**: Buttons to download data as JSON or Excel.

### Logic & Functionality
*   **Two-Way Binding**: When the page loads, `profile.js` must fetch the user document and *populate* all these inputs (`value="..."`). When saved, it must *read* them back and update Firestore.
*   **Dynamic UI**: The "Overview" cards use status classes like `.is-safe` (green) or `.is-risk` (red) to visually code the financial status.
*   **Modals**: The "Export Profile" modal puts the raw JSON data into a `<textarea>` for easy copying.

### Connections
*   **Firestore**: heavily interacts with the `users/{userId}` document.
*   **`profile.js`**: Complex logic to handle the multi-part form updates and password reset emails.

### Best Practices & Improvements
*   **Strengths**:
    *   **Data Portability**: Providing "Export JSON" and "Clear Data" features is excellent for user trust and complies with data handling principles (like GDPR concepts, even if informal).
    *   **Grouping**: Settings are logically grouped (Personal, Security, Data), preventing cognitive overload.
*   **Improvements**:
    *   **Phone Validation**: The phone input is `type="tel"`, but there's no visible pattern validation (e.g., regex for Ethiopian numbers). Adding `pattern="^\+251..."` would prevent bad data.

### Teaching Style: Q&A
**Q: What is "Two-Factor Authentication" (2FA) in this context?**
A: It adds a second lock to the door. Even if someone steals your password, they can't get in without the second key (usually a code sent to your phone). The UI shows a toggle for this, implying the app supports upgrading security.

---

## signup.html

### Purpose & Role
`signup.html` is the onboarding ramp. Its goal is to collect the minimum necessary information to create a useful account. It sets the initial state for the user (Name, Budget, Currency) so the dashboard isn't empty when they first arrive.

### Structure & Sections
1.  **Extended Form**:
    *   **Name Split**: Asks for "First Name" and "Last Name" separately, unlike Profile which might combine them.
    *   **Budgeting Basics**: Crucially asks for "Monthly Budget" and "Currency" *upfront*. This "Activation" step ensures the user gets value immediately after signing up.
    *   **Helper Text**: Uses `<small>` tags to explain *why* data is needed ("We'll use this for login...").

2.  **Value Reinforcement**:
    *   **Note Section**: A sidebar or bottom note reminding users what they unlock (Track expenses, Sync data). This reduces drop-off rates by reminding users of the reward.

### Logic & Functionality
*   **Account Creation Transaction**: Signing up is often a two-step process in the code:
    1.  Create the Auth User (Email/Password).
    2.  Create the Database Document (Name, Budget, Currency).
    If step 2 fails, step 1 might need to be rolled back. `signup.js` likely handles this sequence.
*   **Password Matching**: The "Confirm Password" field is a client-side check. Browsers don't check this automatically; JS must verify `password === confirm` before submitting.

### Connections
*   **`signup.js`**: Coordination file.
*   **`auth.js`**: Uses `createUserWithEmailAndPassword`.

### Best Practices & Improvements
*   **Strengths**:
    *   **Autocomplete**: `autocomplete="given-name"`, `autocomplete="new-password"`. Excellent attention to detail.
    *   **Input Types**: `type="number"` for the budget.
*   **Improvements**:
    *   **Password Strength**: There is no visual meter for password strength. Adding one helps users pick safer passwords proactively rather than getting an error after clicking submit.

### Teaching Style: Q&A
**Q: Why do we ask for "Monthly Budget" during sign up?**
A: It's called "Time to Value." If we just let them sign up with an email, their dashboard would say "0% Budget Used" of "0 Budget". It looks broken. By asking now, their first dashboard view says "0% of 5000 Birr Used"—which makes sense immediately.

---

## split.html

### Purpose & Role
`split.html` addresses a specific pain point for students: sharing costs. It is a utility calculator that determines "who owes what" for shared expenses (dinners, group projects). It features a real-time reactive interface with quick presets to make calculation instantaneous.

### Structure & Sections
This page is built like a "Single Page App" (SPA) tool within the larger site.

1.  **Input Card (`.split-form-card`)**:
    *   **Core Inputs**: Total amount and Number of people.
    *   **Smart Presets**: "Quick total" buttons (250, 500, 1K) and "Party size" buttons (Pair/Squad/Table). These are excellent UX touches for mobile users who want to tap rather than type.

2.  **Result Card (`.split-result-card`)**:
    *   **Big Number**: The "Each person pays" calculated value is the hero.
    *   **Breakdown List**: A place to show the math (`#splitBreakdownList`).
    *   **Share Actions**: A distinct "Share Summary" button triggering a menu for WhatsApp/Telegram, acknowledging that the result of this calculation needs to leave the app.

3.  **Visualization (`.split-spotlight`)**:
    *   Includes a "Vibe tracker" / "Live share pulse," which involves a sparkline visualization to make the math feel "alive."

### Logic & Functionality
*   **Reactive Math**: Changes to the slider or input fields likely trigger an immediate recalculation (no "Calculate" button needed, though one exists for accessibility).
*   **Share Menu**: The "Share" button toggles a hidden menu. The JS likely constructs a pre-filled message string (e.g., `whatsapp://send?text=We split the bill...`) to deep-link into other apps.
*   **Quick Pills**: The `.split-form__pills` use `data-quick-amount` attributes. A global delegate listener in `split.js` likely captures these clicks to update the input value.

### Connections
*   **`split.js`**: The brain of the calculator.
*   **CSS**: `split.css` is quite heavy, styling the custom range sliders and result cards.

### Best Practices & Improvements
*   **Strengths**:
    *   **Micro-interactions**: The "Glow" effects and "Sparklines" show a high attention to premium UI feel.
    *   **Accessibility**: Input fields use `min`, `max`, and `step` to constrain bad data.
*   **Improvements**:
    *   **Persistence**: It's a "Calculator," not a "Log." If the user leaves the page, the split is lost. Saving the last calculation to `localStorage` or offering to "Save as Expense" would connect this utility back to the core app value.

### Teaching Style: Q&A
**Q: What is the benefit of "Quick Presets" (or Chips)?**
A: They reduce "Cognitive Load." Instead of thinking "How much was it? Maybe 200... no 250," the user sees "250" and just taps. It makes the app feel faster and helpful.

---

## test-firebase.html

### Purpose & Role
This is a **Developer Utility** file, not meant for end-users. Its sole purpose is to verify that the Firebase SDKs load correctly and the configuration is valid without the complexity of the full app UI blocking debug efforts.

### Structure & Sections
*   **Minimalist**: Has no CSS, no navigation, no app shell.
*   **Scripts**: Loads the Firebase SDKs explicitly without `defer` to ensure they run in order immediately.
*   **Inline Config**: Contains a hardcoded "Test" config (or a reference to one) to try initialization.

### Logic & Functionality
*   **Console Logging**: The primary output is to the Browser Console (`F12`). It logs "Firebase loaded" or "Firebase init error."
*   **Error Handling**: Uses a `try...catch` block around `firebase.initializeApp` to safely catch configuration errors.

### Connections
*   **None**: It stands alone. It does verify `firebase-config.js` if included.

### Best Practices & Improvements
*   **Strengths**:
    *   **Isolation**: When the login page is broken, you don't know if it's the UI or the Database. This file isolates the Database variable.
*   **Security Warning**:
    *   **Production Risk**: Startups often forget to delete these files. If this file contains real API keys hardcoded in the `script` tag, it's a minor security leak (though Firebase keys are generally public). It should be removed before deploying to production.

### Teaching Style: Q&A
**Q: Why do we need a "Test" file?**
A: In complex engineering, "Smoke Tests" are vital. Before you build the house, you check if the water pipe actually has water. This file acts as that check for our database connection.

---

## tips.html

### Purpose & Role
`tips.html` is the "Education" pillar of the app. It gamifies financial literacy. Instead of a boring blog, it presents tips as "Challenges" and "Streaks" to engage students. It aims to change user behavior, not just track it.

### Structure & Sections
1.  **Usage Hero**:
    *   Emphasis on "Streaks" (7 days) and outcomes ("+18% Cash confidence"). This uses psychology to motivate the user.

2.  **Content Grid**:
    *   **Highlights**: Featured articles like "50/30/20 remix."
    *   **Progress Bar**: A visual visualizer (`.progress-bar`) showing how many tips have been "completed" or read.

3.  **Dynamic Container**:
    *   `#tipsList`: An empty container waiting for JavaScript to inject the Weekly Tip cards from Firestore.

### Logic & Functionality
*   **Gamification**: The "Streak" logic likely resides in `tips.js`, checking the last login date or last "tip read" timestamp in Firestore.
*   **Read State**: When a user clicks a tip, the app probably updates a `tipsRead` array in their user profile to update the progress bar.

### Connections
*   **`tips.js`**: Fetches content, handles the "Mark as Read" logic.
*   **`dashboard.html`**: The dashboard shows a "Tip of the Day," linking back to here.

### Best Practices & Improvements
*   **Strengths**:
    *   **Content Design**: The use of "Eyebrow" text (`<p class="eyebrow">`), "Labels," and "Pills" (`<span class="pill">`) creates a highly scannable, magazine-like layout.
*   **Improvements**:
    *   **Empty State**: Like other pages, `#tipsList` is empty by default. A skeleton loader (gray bars) would improve the perceived performance while data loads.

### Teaching Style: Q&A
**Q: What is "Gamification" in UX?**
A: It's using game design elements (Points, Badges, Leaderboards) in non-game contexts. Here, the "Streak Counter" makes saving money feel like leveling up in a video game.

---

## weekly-overview.html

### Purpose & Role
This is likely a **Partial** or **Component** file, meant to be injected into another page (like `dashboard.html` or an email template), rather than a standalone full page (note the lack of `<html>` or `<body>` tags). It provides a summary of the week's activity.

### Structure & Sections
*   **Visual Snapshot**: Uses hardcoded SVG icons for "Total Spent," "Remaining," etc.
*   **Reminder List**: A clean UL/LI list for upcoming tasks.

### Logic & Functionality
*   **Static Template**: As it stands, it contains hardcoded data ("Birr 1,250"). The intention is likely for JavaScript to fetch this HTML text, parse it, and replace the numbers before inserting it into the DOM.

### Connections
*   **Unknown Parent**: It's likely loaded via `fetch('weekly-overview.html')` or used as a reference for email construction.

### Best Practices & Improvements
*   **Strengths**:
    *   **SVG Icons**: Inline SVGs ensure the icons look crisp at any size without external requests.
*   **Observation**:
    *   **Fragment**: Since it lacks a `head`, it inherits styles from the parent page where it is loaded. This makes it dependent on the global CSS context.

### Teaching Style: Q&A
**Q: What is an "HTML Fragment"?**
A: It's a piece of HTML that isn't a full page. It's like a Lego brick. You can plug it into a bigger structure (the main page) dynamically. This allows you to split your huge index page into smaller, manageable chunks.

# CSS File Analysis

## style.css

### Purpose & Role
This file is a **Legacy Placeholder**. As the comment inside explicitly states, it exists only for backward compatibility.

### Structure & Sections
*   Contains solely a comment block directing developers to the new architecture (`css/global.css`, etc.).

### Logic & Functionality
*   **None**: It has no active styles.

### Best Practices & Improvements
*   **Strengths**:
    *   **Signposting**: Leaving a "Tombstone" file is better than just deleting it, as it prevents 404 errors for any cached pages or forgotten links that still reference `style.css`.
*   **Improvements**:
    *   **Cleanup**: Once the migration is confirmed 100% complete, this file can be safely deleted to reduce clutter.

---

## css/global.css

### Purpose & Role
`global.css` is the **Monolith** of the project's styling. It is not just a "global" file for variables; it currently contains the entire Design System, including component styles (Cards, Buttons, Forms), Layouts (Header, Footer), resets, and even page-specific overrides. It is the "Single Source of Truth" for the visual layer.

### Structure & Sections
It is a massive file (>2000 lines) organized (loosely) as follows:
1.  **Variables (`:root`)**: Defines the "Tokens" of the design—Colors (`--color-primary`), Spacing (`--space-4`), and Radius (`--radius-md`).
2.  **Theming**: Explicit blocks for `[data-theme="dark"]` and `[data-theme="light"]` that override the CSS variables to switch modes.
3.  **Typography & Reset**: Sets the font family (Inter) and basic box-sizing.
4.  **Components**:
    *   **Navigation**: `.site-header`, `.nav-link`, `.nav-toggle` (Hamburger menu).
    *   **Buttons**: `.btn`, `.btn-primary`, `.btn-icon`.
    *   **Cards**: `.card`, `.page-card` (The building blocks of the dashboard).
    *   **Forms**: `input`, `select`, `.form-grid`.
5.  **Utilities**: `.sr-only` (Screen reader only), `.text-muted`.
6.  **Media Queries**: Massive blocks at the end handling mobile responsiveness (`max-width: 1024px`, `768px`), specifically tweaking the navigation menu into a drawer.

### Logic & Functionality
*   **CSS Variables**: The engine of the theme system. Changing `--color-bg` in the dark mode block automatically repaints the whole app.
*   **Selectors**: Uses attribute selectors heavily (`[data-page="home"]`, `[data-theme="light"]`). This is a powerful way to scope styles without adding extra classes.
*   **Overrides**: There are `!important` flags used in the theme sections (e.g., `background: ... !important`). This is a "Code Smell." It suggests the specificity war was lost, and the developer forced the styles to apply.

### Connections
*   **Every HTML file**: Linked in the `<head>` of typically every page.

### Best Practices & Improvements
*   **Strengths**:
    *   **Tokens**: Using `--space-4` instead of `16px` everywhere makes the design consistent and easy to refactor.
    *   **Dark Mode**: The implementation using CSS variables is the modern, correct way to handle theming.
*   **Improvements**:
    *   **Refactor Needed**: The file is **too big**. It violates the "Separation of Concerns." Navigation styles should be in `components/navbar.css`. Button styles in `components/buttons.css`.
    *   **Specificity Issues**: The reliance on `!important` makes custom overrides difficult. Refactoring to use lower specificity selectors would fix this.

### Teaching Style: Q&A
**Q: Why are CSS Variables (Custom Properties) better than finding/replacing hex codes?**
A: Variables allow for "Runtime" changes. JavaScript can update `--theme-color` instantly based on a user picker. Find/replace is build-time only.
**Q: What is "Mobile-First" vs. "Desktop-First"?**
A: This file appears "Desktop-First" because the base styles are for desktop, and `@media (max-width: ...)` overrides them for mobile. "Mobile-First" is generally preferred for performance (rendering the simpler view by default), but both work.

---

## css/about-animations.css

### Purpose & Role
This module handles the "Delight" layer for the About page. It separates complex keyframe definitions from the structural CSS, keeping `global.css` slightly cleaner.

### Structure & Sections
1.  **Keyframes**: Definitions for `fadeInUp`, `float`, `pulse`, `gradientBG`.
2.  **Classes**: Application classes like `.about-hero` that apply these animations.
3.  **Staggering**: Uses `nth-child` selectors to delay animations (`animation-delay: 0.1s`), creating a "waterfall" effect where items appear one by one.

### Logic & Functionality
*   **Gradients**: Uses `background-clip: text` to create the shiny, multi-color text effect on headlines.
*   **Interaction**: Hover states (`.feature-card:hover`) trigger transforms and shadow expansions.

### Connections
*   **`about.html`**: The primary consumer.
*   **`about.js`**: Contains comments with JS code snippets to enable scroll-triggered animations (Intersection Observer).

### Best Practices & Improvements
*   **Strengths**:
    *   **Performance**: Uses `transform` and `opacity` for animations, which are cheap for the browser to render (GPU accelerated). It avoids animating `layout` properties like `width` or `margin`.
*   **Improvements**:
    *   **Reduced Motion**: It lacks a `@media (prefers-reduced-motion: reduce)` query. Users who get motion sick need a way to turn off these floats and pulses.

### Teaching Style: Q&A
**Q: Why use `transform: translateY` instead of `top` for movement?**
A: Changing `top` forces the browser to re-calculate the position of every neighbor element (Reflow). `transform` is like a visual layer effect—it moves the pixels without disturbing the layout flow. It's much smoother.

---

## css/about-overlay.css

### Purpose & Role
This file styles a specific "Modal" or "Overlay" component used on the About page (likely for a "Read More" or "Team Details" deep dive). It handles the full-screen backdrop and the centered content card.

### Structure & Sections
1.  **Backdrop**: `.about-overlay` creates the dark, blurred background (`backdrop-filter: blur(10px)`).
2.  **Container**: `.about-container` is the white box holding content.
3.  **State**: Uses attributes `[data-visible="true"]` to handle the enter/exit transitions (opacity/visibility).

### Logic & Functionality
*   **Glassmorphism**: The use of `backdrop-filter` creates the modern "frosted glass" look.
*   **Transitions**: Explicit transitions on `opacity` and `transform` ensure the modal fades in and slides up smoothly.

### Connections
*   **`about.js`**: Toggles the `data-visible` attribute.

### Best Practices & Improvements
*   **Strengths**:
    *   **State Management**: Styling based on `data-visible` state is cleaner than adding/removing classes like `.is-open`.
*   **Improvements**:
    *   **Accessibility**: Ensure the overlay traps focus (tabbing) inside it when open, although that's a JS responsibility, the CSS `visibility: hidden` correctly removes it from the accessibility tree when closed.

### Teaching Style: Q&A
**Q: What is `backdrop-filter`?**
A: It applies effects (like blur or grayscale) to the *area behind* the element. It's how Apple builds their iOS interface effects. Note: It can be performance-heavy on old phones.

---

## css/index.css

### Purpose & Role
This file styles the **Marketing Landing Page** (`index.html`). Its primary job is to create a visually distinct "Microsite" feel that differs purely from the functional app dashboard, often using bolder typography and different spacing.

### Structure & Sections
*   **Scoped Root**: Uses `body[data-page="home"]` to redefine global variables (like `--home-bg`) locally.
*   **Hero Section**: Specific gradients and layout for the large introductory area.
*   **Marketing Components**: Styles for "Features," "Stats," and "Team" cards that are unique to the public site.

### Logic & Functionality
*   **Scope Guarding**: Almost every selector is prefixed with `body[data-page="home"]`. This is a defensive coding layer that ensures these bold marketing styles (like cyan buttons) never accidentally leak into the login or dashboard pages, even if the file is loaded globally.
*   **Theme Specifics**: Contains its own `[data-theme="dark"]` overrides, distinct from the global app theme, suggesting the landing page might have a slightly different color identity (e.g., using "Cyan" instead of "Green").

### Best Practices & Improvements
*   **Strengths**:
    *   **Isolation**: The `data-page` scoping makes it very safe to edit this file without breaking the rest of the app.
*   **Improvements**:
    *   **Duplication**: It re-declares button styles (`.btn`) with `!important` to force them to look different. It would be cleaner to use a modifier class like `.btn-marketing` instead of fighting the cascade.

### Teaching Style: Q&A
**Q: Why use `!important` here so much?**
A: It's a "Hammer." The developer likely found that `global.css` styles were overriding their landing page changes. To win the fight quickly, they used `!important`. It works, but it causes headaches later if you want to override *that* override.

---

## css/dashboard.css

### Purpose & Role
This manages the complex, grid-heavy layout of the main **User Dashboard**. It handles the arrangement of high-density data (charts, tables, lists) into a coherent "Control Panel."

### Structure & Sections
1.  **Grid Layouts**: Uses `grid-template-columns: repeat(...)` to create responsive layouts that auto-reflow from 4 columns to 1 on mobile.
2.  **Micro-Components**:
    *   **Sparklines**: `.sparkline` uses a gradient background to simulate a chart bar.
    *   **Chips**: `.chip` styles for the "Week/Month" toggles.
    *   **Status Pills**: `.status-pill` for "Paid/Overdue" labels.
3.  **Scroll Containers**: `.tips-grid` uses `overflow-x: auto` to create a horizontal swipeable list on mobile.

### Logic & Functionality
*   **Responsive Grids**: The media queries explicitly change the grid columns. For example, `.dashboard-stats` goes from 2 columns to 1 column at 768px.
*   **Interactive States**: The `.chip-active` class highlights which date range is selected, providing essential visual feedback.

### Connections
*   **`dashboard.html`**: The HTML structure relies entirely on these classes for layout.
*   **`theme.css` / `global.css`**: Inherits the card shadows and base colors.

### Best Practices & Improvements
*   **Strengths**:
    *   **CSS Grid**: The use of `minmax(320px, 1fr)` is a modern, robust way to build cards that stretch nicely but never get too small.
    *   **Scroll Snap**: The `.tips-grid` uses `scroll-snap-type: x mandatory`. This gives the scrolling list a "native app" feel where cards snap into place when you swipe.
*   **Improvements**:
    *   **Hardcoded Gradients**: The progress bars use fixed hex code gradients. If the theme changes to "Purple," these will stay Green/Orange. They should use `var(--color-primary)` variables.

### Teaching Style: Q&A
**Q: What is `minmax(320px, 1fr)`?**
A: It tells the Grid: "Make this column at least 320 pixels wide. If there's more space, take up 1 fraction of it." It's the secret to responsive layouts that don't squash content.

---

## css/about.css

### Purpose & Role
This stylesheet is dedicated to the standard **About Page** (`about.html`). It focuses on storytelling elements like the hero section with its "Orbit" animation and the "Pillars" grid.

### Structure & Sections
*   **Hero Animation**: The `.about-hero__orbit` class creates a unique rotating atom/solar-system effect using CSS keyframes (`animation: orbitGlow`).
*   **BEM Naming**: Uses Block-Element-Modifier naming conventions fairly strictly (`.about-hero__actions`, `.about-hero__stats`).
*   **Backgrounds**: Complex radial gradients are used on the `.about-shell` to create a soft, glowing atmosphere.

### Logic & Functionality
*   **Animation**: The 30-second infinite loop on the orbit ring (`animation: orbitGlow 30s linear infinite`) adds a subtle, premium dynamic feel to the page without requiring JavaScript.
*   **Z-Indexing**: Explicit layer management (`z-index: -1` for backgrounds) ensures the content sits legibly above the decorative blurs.

### Best Practices & Improvements
*   **Strengths**:
    *   **CSS-Only Animation**: Moving the orbit logic to CSS keeps the main thread free for JS logic and scrolling.
    *   **Layout Stability**: Using `minmax` grids ensures the text doesn't flow awkwardly on resizing.
*   **Improvements**:
    *   **Hardcoded Colors**: There is a lot of hardcoded `rgba(15, 23, 42, ...)` (Slate color) which circumvents the global theme variables. This makes maintaining consistency difficult if the primary brand color changes.

### Teaching Style: Q&A
**Q: Why use `pointer-events: none` on the background?**
A: It ensures that the decorative blurry blobs don't accidentally block mouse clicks on the buttons or links sitting "behind" them visually but maybe "above" them in the DOM stack.

---

## css/abouts.css

### Purpose & Role
This is for the **Alternate About Page** (`abouts.html`). It appears to be a completely separate "Micro-Theme" experiment, possibly redesigning the About page with a different visual identity.

### Structure & Sections
*   **Local Tokens**: It defines its *own* root variables at the top (`:root { --abouts-primary: ... }`). This is highly unusual and suggests this page is meant to look distinctly different from the rest of the app (e.g., using Purple/Violet instead of the main Green/Blue).
*   **Dark Mode Override**: It manually redefines colors for dark mode inside its own scope, separate from `global.css`.

### Logic & Functionality
*   **Theme Isolation**: By using `--abouts-*` prefixed variables, it ensures that changing the global theme (`global.css`) won't break this page, but also means this page won't benefit from global updates. It's a double-edged sword.
*   **Gradient Text**: Heavy use of gradients and shadows (`--abouts-shadow-xl`) creates a more "Startup/SaaS" marketing look.

### Best Practices & Improvements
*   **Strengths**:
    *   **Visual Distinction**: Provides a clear playground for testing a new design language without risk to the main app.
*   **Improvements**:
    *   **Maintainability Risk**: "Shadow DOM" logic (not literal Shadow DOM, but conceptual). If the main app changes its font size or spacing, this page will drift out of sync because it defines its own rules. It should ideally inherit `global.css` tokens and just override the colors.

### Teaching Style: Q&A
**Q: What is a "Micro-Front end" or "Micro-Theme"?**
A: It's when a specific part of a website (like a checkout flow or a landing page) has its own independent codebase/styling. It allows teams to move fast on that specific part, but risks inconsistency.

---

## css/analysis.css

### Purpose & Role
Styles the **Data Analysis** page (`analysis.html`). This is a tool-heavy page featuring chart containers, export controls, and complex data grids.

### Structure & Sections
*   **Chart Containers**: `.chart-surface` and `.chart-preview` set rigid dimensions (`height: 320px`) to ensure Chart.js canvases render correctly without flickering.
*   **Toolbar**: `.analysis-controls` uses `position: sticky` to keep filter buttons visible while scrolling through long data logs.
*   **Button Specifics**: Specific IDs (`#analysisExportPdf`) are targeted to give them distinct colors (Green for PDF, which matches the "Excel/Data" mental model).

### Logic & Functionality
*   **Sticky Headers**: The controls stick to the top (`top: var(--space-3)`), creating a persistent workspace feel.
*   **Interaction**: The `.share-menu` toggles visibility. The CSS handles the layout, while JS presumably handles the `[hidden]` attribute.
*   **Scroll & Overflow**: `.share-menu` has `overflow-x: auto`, anticipating that on mobile, the row of share buttons might be wider than the screen.

### Best Practices & Improvements
*   **Strengths**:
    *   **Sticky Positioning**: Great UX choice for a data-heavy page. Users don't have to scroll up to filter.
*   **Improvements**:
    *   **ID Selectors**: Targeting buttons by ID (`#analysisExportPdf`) increases specificity too much. It's better to use classes (`.btn-export-pdf`) so you can reuse the style on other pages if needed.

### Teaching Style: Q&A
**Q: Why do Chart.js canvases need a container with fixed height?**
A: HTML5 Canvas elements don't inherently know their size like an image does. If the parent doesn't constrain them, they often collapse to 0px or explode to fill the screen. The CSS container acts as a "Frame" for the canvas to draw into.

---

## css/expenses.css

### Purpose & Role
Styles the **Expense Management** page (`expenses.html`). This uses a highly modular "Dashboard-lite" approach, sharing some design language with the main dashboard but introducing specific tools for transaction management.

### Structure & Sections
*   **Hero Metrics**: The `.page-hero--expenses` uses a subtle gradient to distinguish it from other pages. It contains "Glance" cards for quick stats.
*   **Tables**: Extensive styling for `.expenses-table` and `.table-row`, including hover states and action buttons (Edit/Delete chips).
*   **Visualizations**: Custom styles for `.donut-chart` (a CSS-only circle container) and `.pulse-chart` (simulating a heartbeat graph).

### Logic & Functionality
*   **Status Indicators**: Uses `.dot--class` modifiers to color-code categories (Food=Green, Transport=Orange) matching the Chart.js dataset colors.
*   **Responsive Tables**: On mobile, the table layout shifts dramatically. The headers (`.table-head`) disappear, and rows become cards (`display: grid`) where each cell is a block with a generated label.

### Best Practices & Improvements
*   **Strengths**:
    *   **Mobile Tables**: The transformation of tables into cards at `max-width: 640px` is a textbook example of accessible responsive design for data constraints.
*   **Improvements**:
    *   **Complexity**: The file is quite long (700+ lines). The "Pulse Chart" and "Donut Chart" styles are complex and purely visual; if they are not being used (since Chart.js is present), they should be removed to reduce bloat.

### Teaching Style: Q&A
**Q: How does the responsive table work without JS?**
A: It often uses `display: none` on the `<thead>` and changes the `<tr>` to `display: block`. A common trick is using `::before { content: attr(data-label); }` on table cells to show the column name (like "Amount:") inline on mobile.

---

## css/login.css

### Purpose & Role
Styles the **Authentication Pages** (`login.html` and `signup.html`), although `signup.css` also exists (likely sharing or splitting duties). It focuses on centering the form and making the inputs touch-friendly.

### Structure & Sections
*   **Centering**: Uses `display: grid; place-items: center;` on the wrapper to perfectly center the login card vertically and horizontally.
*   **Feedback**: `.login-message` handles error/success toasts with specific color mixes (`color-mix` used for transparency).

### Logic & Functionality
*   **Input Usability**: The media queries explicitly ensure inputs have `min-height: 48px` on mobile. This is an Apple Human Interface Guideline standard (minimum touch target size) to prevent "Fat Finger" errors.
*   **Modern CSS**: The use of `color-mix(in srgb, var(--danger) 12%, transparent 88%)` is a very modern feature that avoids calculating hex opacities manually.

### Best Practices & Improvements
*   **Strengths**:
    *   **Touch Targets**: Excellent attention to mobile usability (preventing iOS zoom with font-size adjustments).
*   **Improvements**:
    *   **Scope**: Some generic classes like `.btn` are redefined here inside media queries, which might conflict with `global.css` if not careful.

### Teaching Style: Q&A
**Q: Why `font-size: 16px` on inputs for mobile?**
A: iOS Safari zooms in on any input with a font size smaller than 16px when you tap it. Setting it to 16px prevents this jarring auto-zoom effect.

---

## css/profile.css

### Purpose & Role
Styles the **User Profile** page (`profile.html`). This is one of the most visually rich pages, featuring a large banner, avatar management, and complex tab-like sections for "Security," "Budgets," and "Notifications."

### Structure & Sections
*   **Hero Section**: `.profile-hero` features a complex multi-gradient background (`radial-gradient` + `linear-gradient`) to create a frosted, glassy header.
*   **Avatar**: Handles the logic for the profile picture, including the "Upload" overlay and the circular cropping.
*   ** Cards**: Uses `.overview-card` with hover effects that reveal a colored strip (`::before` psuedo-element) indicating status (Risk/Safe).

### Logic & Functionality
*   **Interactive Cards**: The `.overview-card:hover` effect uses a `::before` element that expands from 4px to 8px width. This subtle animation guides the user's focus.
*   **Theme Integration**: Heavy use of `[data-theme="dark"]` overrides to adjust the transparency of the glassmorphism effects, ensuring text remains readable against the dark background.

### Best Practices & Improvements
*   **Strengths**:
    *   **Visual Hierarchy**: The use of "Danger Zone" styling (red borders/accents) clearly demarcates destructive actions.
*   **Improvements**:
    *   **CSS Length**: At 1000+ lines, this file handles too much. The "Upload Component" and "Budget Progress Bars" could be extracted into reusable components.

### Teaching Style: Q&A
**Q: What is "Glassmorphism"?**
A: It's a design trend using transparency (`rgba(255,255,255,0.5)`), background blur (`backdrop-filter: blur(10px)`), and subtle white borders to make elements look like frosted glass floating in space.

---

## css/signup.css

### Purpose & Role
Styles the **Sign Up Page** (`signup.html`). While it shares DNA with `login.css`, it handles more complex form layouts like the 2-column "Name" and "Budget" rows.

### Structure & Sections
*   **Grid Layouts**: Uses `grid-template-columns: 1fr 1fr` for the `.name-fields` to arrange First and Last Name side-by-side, collapsing to a single column on mobile.
*   **Notes**: The `.signup-note` class creates a highlighted box with a left border accent, used to explain terms or requirements to the user.

### Logic & Functionality
*   **Form Interaction**: Sets `pointer-events: auto !important` on inputs to ensure that no decorative overlay accidentally blocks the user from typing. This is a common safety fix in "High Design" sites where decorative blurs might overlap actual content.

### Best Practices & Improvements
*   **Strengths**:
    *   **Helper Text**: Distinct styling for `.helper-text` ensures users know *what* to type before they make a mistake.
*   **Improvements**:
    *   **Duplication**: A significant chunk of code (card styling, inputs, buttons) is duplicated from `login.css`. These should share a common `auth.css` file.

### Teaching Style: Q&A
**Q: Why use `1fr 1fr` instead of `50% 50%`?**
A: `1fr` is a "Flexible Fraction". If you add a gap (`gap: 16px`), `1fr 1fr` automatically subtracts the gap size from the available space. `50%` would force the columns to be too wide, causing overflow or wrapping.

---

## css/split.css

### Purpose & Role
Styles the **Bill Splitter** page (`split.html`). This is a visually distinct "Feature Page" that feels almost like a mini-app within the app, featuring its own animations and playful design elements.

### Structure & Sections
*   **Animations**: Defines custom keyframes `sparklineRise`, `orbitSpin`, and `ribbonSlide` purely for this page.
*   **The Spotlight**: The `.split-spotlight` section uses complex gradients and floating orbs to highlight key metrics.
*   **Participants Grid**: Styles the list of people (`.split-participant`) with sliders and avatars.

### Logic & Functionality
*   **Interactive Ribbon**: The scrolling text ribbon (`animation: ribbonSlide`) adds a trendy, kinetic energy to the page.
*   **Dark Mode**: Extensive overrides ensure the complex gradients (which usually look bad in dark mode) are swapped for darker, more subtle variants.

### Best Practices & Improvements
*   **Strengths**:
    *   **Engagement**: The animations make a boring task (math/bill splitting) feel fun and modern.
*   **Improvements**:
    *   **Performance**: Infinite animations (orbits, ribbons) can drain battery on mobile devices. They should be wrapped in a `@media (prefers-reduced-motion: reduce)` query to disable them for users who want to save battery or avoid motion sickness.

### Teaching Style: Q&A
**Q: What is a "Sparkline"?**
A: It's those tiny little bar charts you see inline with text. In this CSS, they are animated using `<span>` tags whose height grows from 15% to 90% via CSS keyframes.

---

## css/tips.css

### Purpose & Role
Styles the **Financial Tips** page (`tips.html`). It focuses on readability (large blockquotes) and discoverability (grid cards for advice topics).

### Structure & Sections
*   **Hero**: Another unique hero implementation (`.page-hero--tips`) with a green-to-blue gradient theme.
*   **Interactivity**: The cards use a `::before` pseudo-element with a customized background color (`#f5e6d3` - Light Brown) that fades in on hover (`opacity: 0` -> `1`).

### Logic & Functionality
*   **Hover Effects**: Unlike other pages that just lift up (`translateY`), these cards change their entire background color on hover. The text color also transitions to black (`#333`) to ensure contrast against the new background.
*   **Dark Mode Inversion**: Interestingly, it uses `filter: brightness(0) invert(1)` to turn icons white in dark mode. This is a "Lazy" but effective way to recolor SVG icons without changing their fill attributes manually.

### Best Practices & Improvements
*   **Strengths**:
    *   **Readable Typography**: Large blockquotes (`font-size: 1.3rem`) break up the density of text, making the educational content easier to digest.
*   **Improvements**:
    *   **Hardcoded Colors**: The hover color `#f5e6d3` is hardcoded. If the site theme changes to Cool Blue, this warm brown will clash. It should be a variable like `--hover-bg-accent`.

### Teaching Style: Q&A
**Q: How does `filter: invert(1)` work?**
A: It mathematically inverts every color channel. Black becomes White, Blue becomes Orange. It's mostly used to quickly turn black icons white for dark mode.

---

## js/firebase-config.js

### Purpose & Role
The **Bridge to Firebase**. This file initializes the Firebase app using the provided API keys and exports the core services (`auth`, `firestore`) to the global `window` object so other scripts can access them.

### Structure & Logic
*   **IIFE Pattern**: Wraps logic in an Immediately Invoked Function Expression `(function(){...})()` to avoid polluting the global namespace with temporary variables, while explicitly exposing only what's needed (`window.firebaseApp`).
*   **Error Handling**: Uses a `try-catch` block around `firebase.initializeApp` to gracefully handle cases where the app is already initialized (preventing "Firebase App named '[DEFAULT]' already exists" errors).

### Key Concepts
*   **Global Export**: It attaches `firebaseAuth` and `firestore` to `window`, acting as a Singleton pattern for the entire app.

---

## js/common.js

### Purpose & Role
The **Standard Library** of the application. It contains 800+ lines of shared utilities, default data, state management (localStorage wrappers), and UI logic like the Theme Toggle and Navigation.

### Structure & Logic
*   **State Management**: Functions like `saveState(key, value)` and `loadState(key, fallback)` abstract away `JSON.parse/stringify` and error handling for `localStorage`.
*   **Auth Middleware**: `requireAuth()` acts as a gatekeeper. It checks if a user is logged in (via Firebase or localStorage fallback) and redirects to `login.html` if not, preventing unauthorized access to protected pages.
*   **Theme Engine**: The `toggleTheme()` function switches the `data-theme` attribute on the `<html>` tag and emits a custom event `themeChange`, allowing charts and other components to react dynamically.

### Best Practices vs. Improvements
*   **Strengths**:
    *   **Fallback Data**: `defaultExpenses` and `defaultTips` ensure the app never looks "broken" or empty for a new user.
    *   **Namespace**: exporting everything under `window.App` is a clean way to organize global tools.
*   **Improvements**:
    *   **Monolith**: This file is doing too much (Auth, UI, Data, Config). The "Auth" logic specifically should be fully moved to `auth.js` or `session.js`.

---

## js/auth.js

### Purpose & Role
The **Authentication Controller**. It encapsulates all Firebase Auth interactions (Login, Signup, Logout, Password Reset) and acts as the high-level API for user identity.

### Structure & Logic
*   **Async Initialization**: Uses a polling mechanism (`setInterval`) and a custom event (`firebaseReady`) to ensure it doesn't try to use Firebase before `firebase-config.js` has finished loading.
*   **Error Mapping**: Wraps raw Firebase error codes (e.g., `auth/user-not-found`) into human-readable messages ("No account found with this email").
*   **Profile Sync**: When a user signs up, it immediately creates a user document in Firestore via `saveUserProfile`, ensuring the database stays in sync with Auth.

### Key Concepts
*   **Defensive Coding**: The `waitForFirebase()` method ensures that even if the network is slow, the auth calls will wait for the SDK to load instead of crashing immediately.

---

## js/dashboard.js

### Purpose & Role
The **Central Command** for the logged-in experience. It manages the main dashboard view, connecting the data model (Expenses, User Budget) to the UI (Tables, Progress Bars, Summary Cards).

### Structure & Logic
*   **Initialization Flow**: `checkAuthAndInit` -> `initDashboard`. It double-checks authentication before even trying to render sensitive financial data.
*   **Live Metrics**: functions like `updateHero()` and `updateExpenseInsights()` recalculate totals, remaining budget, and daily averages every time an expense is added or modified.
*   **Sparklines**: It uses CSS variables (`--spark-scale`) to dynamically size the mini-charts in the hero cards based on data values (0 to 1).

### Key Features
*   **CRUD Operations**: Fully implements Create, Read, Update, and Delete for expenses using a modal interface.
*   **Reminders System**: A simple todo-list feature stored in `localStorage` (`edufinance-reminders`) for tracking bills.

---

## js/charts.js

### Purpose & Role
The **Visual Storyteller**. While `dashboard.js` handles lists and numbers, this file manages the sophisticated data visualizations using `Chart.js`.

### Structure & Logic
*   **SVG Generation**: It manually constructs SVG paths (`path d="..."`) to create the "Pulse Line" graph, a complex visual that shows spending trends without needing a heavy chart library for that specific element.
*   **Smart Suggestions**: It analyzes transaction history for keywords like "Coffee", "Gym", or "Cosmetics" and displays trend arrows (↑ 15%) to give users personalized insights.
*   **Gauge Chart**: Implements a custom "Credit Score" style gauge using a doughnut chart and a canvas-drawn needle to visualize Financial Health.

### Best Practices
*   **Resiliency**: Extensive `try-catch` blocks ensure that if one chart fails to render (e.g., bad data), it doesn't crash the entire dashboard.

---

## js/analysis.js

### Purpose & Role
The **Deep Dive** tool. It powers the dedicated Analysis page, offering features for power users who want to slice and dice their data.

### Structure & Logic
*   **PDF Export**: Uses the `jsPDF` library (loaded dynamically via CDN) to generate a client-side PDF report complete with headers, summaries, and a paginated transaction table.
*   **Web Share API**: The `shareSummary()` function uses the modern `navigator.share` API on mobile devices to share reports directly to WhatsApp/Telegram, falling back to Clipboard/Email on desktop.
*   **Date Normalization**: The `toDateKey()` helper ensures all dates are handled as local `YYYY-MM-DD` strings, avoiding the common "off-by-one day" timezone bugs in JavaScript dates.

### Teaching Style: Q&A
**Q: Why use `navigator.share`?**
A: It triggers the native OS share sheet (like on your iPhone or Android), allowing users to share content directly to any app installed on their phone, rather than just limited options we hardcode.

---

## js/expenses.js

### Purpose & Role
The **Ledger Manager**. Controls the full-page table of expenses (`expenses.html`), offering advanced filtering, searching, and bulk export capabilities that `dashboard.js` omits for simplicity.

### Structure & Logic
*   **Real-time Search**: Listens to `input` events on the search bar to filter rows instantly based on matches in the `category` or `notes` fields.
*   **Data Integrity**: Uses `App.saveState()` to persist edits immediately. It handles the specific edge case of "adding" vs "editing" by checking if `editingId` is null.
*   **PDF Generation**: Uses `jspdf-autotable` to create a professional-looking styled table in the exported PDF, rather than just a plain text dump.

### Key Features
*   **Budget Awareness**: It calculates and updates the "Safe to Spend" metric in the pulse stats whenever the user adds a new expense, keeping the feedback loop tight.

---

## js/profile.js

### Purpose & Role
The **User Settings Hub**. Manages the user's identity, preferences, and "Account" state.

### Structure & Logic
*   **Base64 Images**: Handles profile picture uploads by reading the file with `FileReader` and converting it to a Base64 string (`data:image/png;base64...`). This string is saved directly into `localStorage`.
    *   *Note*: This is convenient for prototypes but can hit the 5MB localStorage limit quickly if the user uploads a high-res photo.
*   **Data Management**: Contains the "Clear Data" (Nuclear Option) function which iterates through all `STORAGE_KEYS` and removes them, effectively factory resetting the app.

### Best Practices vs. Improvements
*   **Mock Data**: The "Transactions" and "Obligations" tables in this file use hardcoded arrays (`const transactions = [...]`). These should eventually be connected to the real `expenses` data or a backend API.

---

## js/split.js

### Purpose & Role
The **Bill Splitter Engine**. A self-contained utility for calculating group costs, featuring weighted splitting and real-time visualization.

### Structure & Logic
*   **Weighted Math**: Allows users to assign "Weights" (e.g., someone ate twice as much). The formula is `(Total * Weight) / SumOfAllWeights`.
*   **Penny Pincher**: Includes logic to handle rounding errors. If a split results in `$33.3333...`, it rounds to 2 decimals and adds the remainder to the last person's share to ensure the total is exactly correct.
*   **Reactive UI**: Updates the "Share Summary" charts instantly as you drag the sliders, using a localized `renderResults()` loop.

### Teaching Style: Q&A
**Q: Why `encodeURIComponent`?**
A: When sharing data via URL (like in WhatsApp: `wa.me/?text=...`), characters like space ` ` or ampersand `&` can break the link. Encoding converts them to safe codes like `%20`.

---

## js/tips.js

### Purpose & Role
The **Gamified Educator**. Controls the "Financial Tips" page (`tips.html`), tracking which advice the user has read or completed.

### Structure & Logic
*   **Progress Tracking**: Uses a simple dictionary object `progress: { 'tip-id': true }` stored in `localStorage` to remember which cards the user has checked off.
*   **Quote Rotator**: Uses `setInterval` to cycle through a hardcoded array of financial quotes every 6 seconds, adding a dynamic feel to the page header.

---

## js/index.js

### Purpose & Role
The **Welcome Mat**. Handles the interactions on the public landing page (`index.html`). Its primary job is to be lightweight and engaging.

### Structure & Logic
*   **Intersection Observer**: Uses this API to highlight navigation links (e.g., "Home", "Features") as the user scrolls down the page. This is more performant than listening to the raw `scroll` event.
*   **Smooth Scrolling**: Hijacks anchor link clicks (`href="#features"`) to provide a smooth scroll animation instead of a jarring jump.
*   **Auth Redirection**: If a logged-in user visits the landing page, it automatically changes the "Get Started" link to point to the `dashboard.html` instead of `signup.html`.

---

## js/login.js & js/signup.js

### Purpose & Role
The **Gatekeepers**. These files handle the critical flow of user entry.

### Structure & Logic (Shared)
*   **Firebase Integration**: Both files directly interface with the global `Auth` object (from `js/auth.js`) to perform `signIn` and `signUp` operations.
*   **Session Guard**: They check `window.firebaseAuth.currentUser` on load. If a user is already logged in, they are immediately redirected to the dashboard to prevent "double login".
*   **Validation**:
    *   **Signup**: Enforces password length (>6 chars) and matching confirmation fields.
    *   **Real-time Feedback**: Uses `input` listeners to clear error messages as soon as the user starts typing, providing a smoother experience than making them click "Submit" again to see if it's fixed.
*   **Profile Initialization (`signup.js`)**: When a user registers, this file constructs their initial data object (Default Budget, Currency choice) and passes it to the Auth system to be saved in Firestore.

---

## js/about.js

### Purpose & Role
The **Brand Ambassador**. Adds polish and interactivity to the About page (`about.html`).

### Structure & Logic
*   **Scroll Animations**: Uses `IntersectionObserver` to add a `.visible` class to elements (like the "Pillars" cards) as they scroll into view, triggering CSS transitions.
*   **Micro-interactions**: Adds dynamic hover effects to cards using JavaScript to track mouse movement or simply toggle classes, enhancing the "premium" feel defined in the CSS.
*   **Contact Modal**: Implements a simple timeout-based message ("Need to reach us?") that appears when clicking the Contact button, acting as a lightweight notification system without a full backend contact form.



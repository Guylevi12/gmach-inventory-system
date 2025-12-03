# Components Guide

Use this file whenever you need a quick understanding of `src/components` instead of re-reading the whole project. If asked to “read the project”, consult this first and then open only the files referenced here for details.

## Layout
- Entry points: `Dashboard.jsx` (admin landing with NewLoan + calendar), `CalendarPage.jsx` (calendar page wrapper), `Catalog.jsx` (public grid), `Navbar.jsx` (role-aware nav), floating bubbles (`NavigationBubble.jsx`, `HoursBubble.jsx`, `ContactBubble.jsx`).
- Static/info pages: `Home.jsx`, `About.jsx`, `BorrowingGuidelines.jsx`, `DonationsPage.jsx`, `EmailReminderSystem.jsx` (UI around email reminders). Note: some Hebrew copy in source is mojibake but logic is intact.

## Orders & Loans
- Creation: `NewLoan/NewLoan.jsx` orchestrates form + catalog modal, validates dates against `closedDatesService`, auto-fills client via `phoneAutoCompleteService`, computes availability from open orders, assigns `simpleId`, writes to `orders`. Helpers: `NewLoanForm.jsx`, `NewLoanModal.jsx`, `ScanResultModal.jsx`.
- Lifecycle: `RequestLoan.jsx`, `PendingRequests.jsx`, `ReturnInspectionModal.jsx`, `InspectionHistoryView.jsx`, `LoanHistory.jsx`, `MyOrders.jsx`, `LoanStatisticsModal.jsx`.
- Active item usage: `ActiveOrdersModal.jsx` shows open orders containing a given item.

## Inventory
- Admin CRUD: `ItemManager.jsx` with pagination, image normalization/migration, deleted-item restore; uses `ItemFormModal.jsx`, `ImageGallery.jsx`, `ActiveOrdersModal.jsx`, Firestore helpers in `services/firebase/itemsService.jsx`.
- Public view: `Catalog.jsx` uses `normalizeItemImages` + `ImageGallery`, has search/pagination and a modal (`ProductModal`) to view details.
- Item details: `ItemDetails.jsx`.

## Calendar
- `CalendarPage.jsx` loads items/orders then renders `HebrewCalendar/HebrewCalendar.jsx`.
- Calendar internals: `HebrewCalendar/CalendarGrid.jsx`, `EventModal.jsx`, `ItemsModal.jsx`, `EditItemModal.jsx`, `CalendarUtils.jsx`, styles in `HebrewCalendar/css/CalendarGrid.css`. Utilities build events from orders, migrate event dates, and adjust stock.

## Alerts & Notifications
- `AlertBanner.jsx`: sticky, dismissible live alerts from Firestore (`alerts`), with collapse/restore (sessionStorage).
- `AlertsManagement.jsx`: admin CRUD for alerts, supports expiration dates and active toggle.
- `AvailabilityNotification.jsx`: admin-only conflict notifier (listens to `orders` where `availabilityStatus === CONFLICT`), can minimize/dismiss, links to calendar.

## Auth & Users
- `Login.jsx`, `Register.jsx` for auth UI.
- `ManageUsers.jsx` for admin role/user management.

## Return workflow (returns/inspection)
- `ReturnInspectionModal.jsx`: handles return inspection flow per order (triggered from EventModal buttons when return is due/overdue).
- `InspectionHistoryView.jsx`: history/logs of inspections.
- `LoanHistory.jsx`: historical orders view with filters/statuses.

## New Loan flow details
- `NewLoan/NewLoan.jsx`: orchestrates form, item catalog modal, date validation, availability calculation, assigns `simpleId`, writes to `orders`.
- `NewLoanForm.jsx`: UI for client/volunteer info + dates; validates phone and dates (against closed dates).
- `NewLoanModal.jsx`: item picker (filters available qty by overlapping open orders for chosen dates), supports quantity selection and search; persists previous selections when reopening.
- `ScanResultModal.jsx`: helper for barcode scans in the loan flow.

## Calendar flow details
- `CalendarPage.jsx`: fetches items/orders, passes to `HebrewCalendar/HebrewCalendar.jsx`.
- `HebrewCalendar.jsx`: main calendar component wiring grid, event modal, items modal, edit modal.
- `CalendarGrid.jsx`: renders days; highlights conflicts/overdue; opens `EventModal` on click.
- `EventModal.jsx`: shows all orders for selected day. Buttons: manual pickup email, edit order items, view details, delete, start return inspection; handles conflict (purple) and overdue (red) states. Scroll area is flex-based to keep bottom buttons visible.
- `ItemsModal.jsx`: per-day item view.
- `EditItemModal.jsx`: edit items for an order directly from calendar.
- `CalendarUtils.jsx`: builds events from orders, migrates legacy eventDate to pickupDate, adjusts stock; provides `fetchItemsAndOrders` helper.
- Styles: `HebrewCalendar/css/CalendarGrid.css`.

## Item management details
- `ItemManager.jsx`: admin CRUD with pagination, active/deleted tabs, image normalization via `imageUtils`, migration guard (`imagesMigrationComplete` localStorage), shows “active orders” modal for in-use items.
- `ItemFormModal.jsx`: modal form for add/edit, supports image URL/file, public/internal comments.
- `ActiveOrdersModal.jsx`: lists open orders containing an item (quantities, dates, client, volunteer).

## Catalog/public view details
- `Catalog.jsx`: public grid, search, pagination, modal (`ProductModal`) with `ImageGallery`; uses `normalizeItemImages`. Pagination logic duplicated here and in ItemManager.
- `ImageGallery.jsx`: shared carousel for item images.

## Alerts & notifications details
- `AlertBanner.jsx`: sticky alerts feed from `alerts` collection; session dismiss/restore; mobile collapse.
- `AlertsManagement.jsx`: admin CRUD (title/message/type/active/expiration).
- `AvailabilityNotification.jsx`: listens to `orders` with `availabilityStatus === CONFLICT`; shows bell bubble (desktop bottom-right, mobile top); can minimize/dismiss for 15 minutes per user.

## Services/hooks
- `hooks/useAvailabilityConflicts.js`: helper to detect conflicts in availability.
- `services/availabilityChecker.js`: calculates conflicts by dates/items.
- `services/closedDatesService.js`: provides closed dates + validation for order dates.
- `services/phoneAutoCompleteService.js`: fills client info by phone.
- `services/emailService.js`: manual pickup email sender (used in EventModal).
- `services/firebase/itemsService.jsx`: Firestore helpers for items add/update/delete/restore.

## Roles / permissions (UI expectations)
- Admins (`MainAdmin`/`GmachAdmin`): can manage items, users, alerts, see conflict notifier, use calendar edit/delete/return-inspection, send manual pickup emails.
- Regular `User`: sees catalog, personal orders, floating bubbles; bubbles hide for non-user roles.

## Known UX/tech notes
- Encoding: some Hebrew strings in sources are mojibake; keep ASCII edits unless fixing copy intentionally.
- IDs: `orders.simpleId` auto-increment; `items.ItemId` auto-increment from max existing.
- Availability: NewLoan subtracts quantities from open overlapping orders to compute available stock.
- Conflicts: `availabilityStatus === CONFLICT` highlights purple; EventModal shows conflict banner and allows actions; AvailabilityNotification surfaces these.
- Return inspection: buttons appear when return is due/overdue (EventModal -> `onStartReturnInspection`).

## Utilities & Shared
- `BarcodeScanner.jsx`: ZXing scanner component, calls `onScanSuccess`.
- `ImageGallery.jsx`: shared image carousel for items; used by Catalog/ItemManager.
- Pagination logic is duplicated in `Catalog.jsx` and `ItemManager.jsx` (same pattern).
- Image helpers: `src/utils/imageUtils.js` for normalize/migrate/getPrimaryImage.

## Data sources (Firestore)
- `db` from `src/firebase/firebase-config.jsx`.
- Collections: `items`, `orders`, `deletedItems`, `alerts`, `users` (roles), plus services like `availabilityChecker.js`, `closedDatesService.js`, `phoneAutoCompleteService.js`, `emailService.js`.

## Notes and pitfalls
- Encoding: several Hebrew strings in components are mojibake; content/logic still works but visible text may need re-encoding if editing copy.
- IDs: new orders use incremental `simpleId`; new items auto-assign `ItemId` from max existing.
- Availability: NewLoan computes available quantities by subtracting open-order quantities overlapping the requested dates.
- Conflicts: `AvailabilityNotification` and `useAvailabilityConflicts.js` surface `availabilityStatus === CONFLICT` orders.

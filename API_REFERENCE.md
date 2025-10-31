# API Referans - Polikrami Cover Backend

**Base URL**: `/api/v1`

---

## 🔐 Auth (`/auth`)

### POST `/register`
- **Fonksiyon**: `registerController`
- **FE → BE**: `{ name, email, password, confirmPassword, role?, acceptTerms, acceptPrivacy, acceptRevenueShare? }`
- **BE → FE**: `{ user, accessToken, refreshToken }`

### POST `/login`
- **Fonksiyon**: `loginController`
- **FE → BE**: `{ email, password }`
- **BE → FE**: `{ user, accessToken, refreshToken }`

### POST `/refresh`
- **Fonksiyon**: `refreshController`
- **FE → BE**: `{ refreshToken }`
- **BE → FE**: `{ accessToken, refreshToken }`

### POST `/logout`
- **Fonksiyon**: `logoutController`
- **FE → BE**: `{ refreshToken? }`
- **BE → FE**: `{ message }`

### POST `/forgot-password`
- **Fonksiyon**: `forgotPasswordController`
- **FE → BE**: `{ email }`
- **BE → FE**: `{ message }`

### POST `/verify-reset-code`
- **Fonksiyon**: `verifyResetCodeController`
- **FE → BE**: `{ email, code }`
- **BE → FE**: `{ resetToken, message }`

### POST `/reset-password`
- **Fonksiyon**: `resetPasswordController`
- **FE → BE**: `{ resetToken, newPassword }`
- **BE → FE**: `{ message }`

### POST `/resend-verification`
- **Fonksiyon**: `resendVerificationController`
- **FE → BE**: `{ email }`
- **BE → FE**: `{ message }`

### POST `/verify-email`
- **Fonksiyon**: `verifyEmailController`
- **FE → BE**: `{ token }`
- **BE → FE**: `{ message, emailVerified }`

---

## 👤 Users (`/users`)

### GET `/me`
- **Fonksiyon**: `meController` 
- **FE → BE**: -
- **BE → FE**: `{ id, name, email, phone, role, profile }`

### PUT `/me`
- **Fonksiyon**: `updateProfileController`
- **FE → BE**: `{ phone?, company?, address1?, address2?, city?, state?, postalCode?, country?, preferences? }`
- **BE → FE**: `{ id, name, email, profile }`

### POST `/me/change-password`
- **Fonksiyon**: `changePasswordController`
- **FE → BE**: `{ currentPassword, newPassword }`
- **BE → FE**: `{ message }`

### PUT `/password`
- **Fonksiyon**: `changePasswordController`
- **FE → BE**: `{ currentPassword, newPassword }`
- **BE → FE**: `{ message }`

### POST `/phone/send-code`
- **Fonksiyon**: `sendPhoneCodeController`
- **FE → BE**: `{ phone }`
- **BE → FE**: `{ message }`

### POST `/phone/verify`
- **Fonksiyon**: `verifyPhoneCodeController`
- **FE → BE**: `{ phone, code }`
- **BE → FE**: `{ message, phoneVerified }`

### POST `/phone/firebase-verify`
- **Fonksiyon**: `firebasePhoneVerifyController`
- **FE → BE**: `{ firebaseToken, phone }`
- **BE → FE**: `{ message, phoneVerified }`

### PUT `/designer-profile`
- **Fonksiyon**: `updateDesignerProfileController` 
- **FE → BE**: `{ artistBio?, specialization?, isAvailable?, iban?, behanceUrl?, dribbbleUrl?, linkedinUrl?, websiteUrl? }`
- **BE → FE**: `{ profile }`

### GET `/designer-profile`
- **Fonksiyon**: `getDesignerProfileController` 
- **FE → BE**: -
- **BE → FE**: `{ artistBio, specialization, isAvailable, iban, behanceUrl, dribbbleUrl, linkedinUrl, websiteUrl }`

### GET `/privacy-settings`
- **Fonksiyon**: `getPrivacySettingsController` 
- **FE → BE**: -
- **BE → FE**: `{ showEmail, showPhone, showAddress, showPortfolio }`

### PUT `/privacy-settings`
- **Fonksiyon**: `updatePrivacySettingsController` 
- **FE → BE**: `{ showEmail?, showPhone?, showAddress?, showPortfolio? }`
- **BE → FE**: `{ message, settings }`

---

## 📝 Drafts (`/drafts`)

### POST `/`
- **Fonksiyon**: `create`
- **FE → BE**: `{ method, categoryId, aiPrompt?, templateId?, assignedDesignerId? }`
- **BE → FE**: `{ id, userId, method, categoryId, status, workflowStatus }`

### GET `/`
- **Fonksiyon**: `list`
- **FE → BE**: Query: `page?, limit?, status?, method?`
- **BE → FE**: `{ drafts[], pagination }`

### GET `/:id`
- **Fonksiyon**: `get`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ id, userId, method, status, assignedDesigner, files, messageCard, shipping, billingAddress }`

### PUT `/:id`
- **Fonksiyon**: `update`
- **FE → BE**: `{ aiPrompt?, coverType? }`
- **BE → FE**: `{ id, aiPrompt, updatedAt }`

### POST `/:id/presign`
- **Fonksiyon**: `getUploadUrl`
- **FE → BE**: `{ filename, contentType }`
- **BE → FE**: `{ url, key, expiresIn }`

### POST `/:id/upload`
- **Fonksiyon**: `uploadFile`
- **FE → BE**: FormData: `file`
- **BE → FE**: `{ message, fileUrl, fileId }`

### POST `/:id/message-card`
- **Fonksiyon**: `setMessageCard`
- **FE → BE**: `{ messageCard: { text, cardType } }`
- **BE → FE**: `{ messageCard, updatedAt }`

### POST `/:id/shipping`
- **Fonksiyon**: `setShipping`
- **FE → BE**: `{ shipping: { firstName, lastName, phone, address, city, state, country, postalCode } }`
- **BE → FE**: `{ shipping, updatedAt }`

### POST `/:id/shipping/address`
- **Fonksiyon**: `setShippingFromAddress`
- **FE → BE**: `{ addressId }`
- **BE → FE**: `{ shipping }`

### POST `/:id/billing`
- **Fonksiyon**: `setBillingAddress`
- **FE → BE**: `{ billingAddress: {...} \| "same_as_shipping" }`
- **BE → FE**: `{ billingAddress }`

### POST `/:id/assign-designer`
- **Fonksiyon**: `assignDesigner`
- **FE → BE**: `{ designerId }`
- **BE → FE**: `{ assignedDesigner, workflowStatus }`

### POST `/:id/commit`
- **Fonksiyon**: `commit`
- **FE → BE**: -
- **BE → FE**: `{ order }`

### POST `/:id/preview`
- **Fonksiyon**: `sendPreview`
- **FE → BE**: -
- **BE → FE**: `{ message, workflowStatus, updatedAt }`

### POST `/:id/revision`
- **Fonksiyon**: `requestRevision`
- **FE → BE**: `{ comments }`
- **BE → FE**: `{ message, workflowStatus, revisionComments, updatedAt }`

### POST `/:id/approve`
- **Fonksiyon**: `approve`
- **FE → BE**: -
- **BE → FE**: `{ message, workflowStatus, status, updatedAt }`

### POST `/:id/cancel`
- **Fonksiyon**: `cancel`
- **FE → BE**: `{ reason? }`
- **BE → FE**: `{ message, status, cancelReason }`

### GET `/:id/workflow-history`
- **Fonksiyon**: `getWorkflowHistory`
- **FE → BE**: -
- **BE → FE**: `{ history[] }`

### GET `/:id/revisions`
- **Fonksiyon**: `getRevisionDetails`
- **FE → BE**: -
- **BE → FE**: `{ revisions[], totalRevisions }`

---

## 🛍️ Orders (`/orders`)

### GET `/`
- **Fonksiyon**: `listMyOrdersController`
- **FE → BE**: Query: `status?, page?, limit?, sortBy?, sortOrder?`
- **BE → FE**: `{ orders[], pagination }`

### GET `/:id`
- **Fonksiyon**: `getOrderController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ id, userId, draftId, status, totalAmount, items[], shippingAddress, payments[], shipments[], timeline[] }`

### POST `/:id/status`
- **Fonksiyon**: `updateOrderStatusTestController`
- **FE → BE**: `{ status }`
- **BE → FE**: `{ id, status, updatedAt }`

### POST `/:id/cancel`
- **Fonksiyon**: `cancelOrderController`
- **FE → BE**: `{ reason? }`
- **BE → FE**: `{ message, status, refundStatus, refundAmount, estimatedRefundDate }`

---

## 💳 Payments (`/payments`)

### POST `/initiate`
- **Fonksiyon**: `initiatePaymentController`
- **FE → BE**: `{ orderId, paymentMethod }`
- **BE → FE**: `{ paymentId, redirectUrl, status, amount, currency, expiresAt }`

### POST `/credit-card`
- **Fonksiyon**: `initiateCreditCardPaymentController`
- **FE → BE**: `{ orderId, cardNumber, cardHolderName, expiryMonth, expiryYear, cvv, saveCard? }`
- **BE → FE**: `{ paymentId, status, transactionId, message }`

### GET `/:paymentId/status`
- **Fonksiyon**: `getPaymentStatusController`
- **FE → BE**: Params: `paymentId`
- **BE → FE**: `{ paymentId, orderId, status, amount, currency, method, transactionId, paidAt, cardInfo }`

### POST `/refund`
- **Fonksiyon**: `refundPaymentController`
- **FE → BE**: `{ paymentId, reason?, amount? }`
- **BE → FE**: `{ refundId, paymentId, amount, status, estimatedCompletionDate, message }`

### POST `/callback`
- **Fonksiyon**: `paymentCallbackController`
- **FE → BE**: Provider-specific data
- **BE → FE**: `{ success, message }`

### GET `/mock/success`
- **Fonksiyon**: `mockPaymentSuccessController`
- **FE → BE**: -
- **BE → FE**: Mock success response

### GET `/mock/failure`
- **Fonksiyon**: `mockPaymentFailureController`
- **FE → BE**: -
- **BE → FE**: Mock failure response

---

## 👨‍🎨 Designers (`/designers`)

### GET `/`
- **Fonksiyon**: `listDesignersController`
- **FE → BE**: Query: `search?, category?, minRating?, maxRating?, page?, limit?, sortBy?, sortOrder?`
- **BE → FE**: `{ designers[], pagination }`

### GET `/recommended`
- **Fonksiyon**: `recommendedDesignersController`
- **FE → BE**: -
- **BE → FE**: `{ designers[] }`

### GET `/sorted`
- **Fonksiyon**: `listDesignersSortedController`
- **FE → BE**: Query: `sortType?, limit?`
- **BE → FE**: `{ designers[], sortType }`

### POST `/:id/reviews`
- **Fonksiyon**: `createReviewController`
- **FE → BE**: `{ rating, comment, orderId? }`
- **BE → FE**: `{ id, designerId, userId, rating, comment, orderId, createdAt }`

### GET `/:id/reviews`
- **Fonksiyon**: `listReviewsController`
- **FE → BE**: Query: `page?, limit?, sortBy?, sortOrder?`
- **BE → FE**: `{ reviews[], statistics, pagination }`

### GET `/public/:id`
- **Fonksiyon**: `publicProfileController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ id, name, avatarUrl, profile: { artistBio, specialization, isAvailable, behanceUrl, dribbbleUrl, linkedinUrl, websiteUrl }, rating: { avg, count } }`

### GET `/public`
- **Fonksiyon**: `searchDesignersController`
- **FE → BE**: Query: `q?, skill?, limit?`
- **BE → FE**: `{ designers[] }`

### GET `/pending-jobs`
- **Fonksiyon**: `getPendingJobsController` 
- **FE → BE**: -
- **BE → FE**: `{ jobs[] }`

### GET `/active-jobs`
- **Fonksiyon**: `getActiveJobsController` 
- **FE → BE**: -
- **BE → FE**: `{ jobs[] }`

### GET `/completed-jobs`
- **Fonksiyon**: `getCompletedJobsController` 
- **FE → BE**: -
- **BE → FE**: `{ jobs[] }`

### POST `/jobs/:id/accept`
- **Fonksiyon**: `acceptJobController` 
- **FE → BE**: Params: `id`
- **BE → FE**: `{ message, jobId, status }`

### POST `/jobs/:id/reject`
- **Fonksiyon**: `rejectJobController` 
- **FE → BE**: Params: `id`, Body: `{ reason? }`
- **BE → FE**: `{ message, jobId, status }`

### POST `/jobs/:id/submit`
- **Fonksiyon**: `submitJobController` 
- **FE → BE**: Params: `id`, Body: `{ files[], message? }`
- **BE → FE**: `{ message, jobId, status }`

### POST `/jobs/:id/revision`
- **Fonksiyon**: `handleRevisionController` 
- **FE → BE**: Params: `id`, Body: `{ files[], message? }`
- **BE → FE**: `{ message, jobId, status }`

---

## 💰 Wallet (`/wallet`)

### GET `/`
- **Fonksiyon**: `getBalanceController`
- **FE → BE**: -
- **BE → FE**: `{ balance, currency, userId, lastUpdated }`

### GET `/history`
- **Fonksiyon**: `getHistoryController`
- **FE → BE**: Query: `page?, limit?, type?, startDate?, endDate?`
- **BE → FE**: `{ transactions[], pagination, summary }`

### GET `/stats`
- **Fonksiyon**: `getStatsController`
- **FE → BE**: -
- **BE → FE**: `{ totalCreditsEarned, totalCreditsSpent, currentBalance, totalPurchases, monthlyStats[], categoryBreakdown }`

### POST `/grant`
- **Fonksiyon**: `grantCreditsController` (🔐 Admin)
- **FE → BE**: `{ userId, amount, reason? }`
- **BE → FE**: `{ message, balance }`

### POST `/purchase`
- **Fonksiyon**: `purchaseCreditsController`
- **FE → BE**: `{ packageType, amount? }`
- **BE → FE**: `{ purchaseId, packageType, credits, amount, currency, paymentUrl, expiresAt }`

### GET `/credit-history`
- **Fonksiyon**: `getCreditHistoryController` 
- **FE → BE**: Query: `page?, limit?, type?, startDate?, endDate?`
- **BE → FE**: `{ transactions[], pagination }`

### GET `/credit-packages`
- **Fonksiyon**: `getCreditPackagesController` 
- **FE → BE**: -
- **BE → FE**: `{ packages[] }`

### POST `/credit-packages/:id/purchase`
- **Fonksiyon**: `purchaseCreditPackageController` 
- **FE → BE**: Params: `id`
- **BE → FE**: `{ purchaseId, packageId, credits, amount, paymentUrl }`

---

## 📦 Shipments (`/shipments`)

### GET `/carriers`
- **Fonksiyon**: `listCarriersController`
- **FE → BE**: -
- **BE → FE**: `{ carriers[] }`

### GET `/public/:id/events`
- **Fonksiyon**: `getShipmentEventsPublicController`
- **FE → BE**: Params: `id`, Query: `token?`
- **BE → FE**: `{ shipmentId, trackingNumber, carrier, currentStatus, events[], estimatedDelivery }`

### GET `/orders/:id/shipments`
- **Fonksiyon**: `getOrderShipmentsController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ shipments[] }`

### GET `/:id/events`
- **Fonksiyon**: `getShipmentEventsController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ shipmentId, trackingNumber, carrier, currentStatus, events[], estimatedDelivery }`

### POST `/orders/:id/shipments`
- **Fonksiyon**: `createShipmentController` (🔐 Admin)
- **FE → BE**: `{ carrier, trackingNumber, estimatedDelivery? }`
- **BE → FE**: `{ id, orderId, carrier, trackingNumber, status }`

### POST `/:id/sync`
- **Fonksiyon**: `syncShipmentController` (🔐 Admin)
- **FE → BE**: Params: `id`
- **BE → FE**: `{ message, status }`

### POST `/webhook/:provider`
- **Fonksiyon**: `webhookController`
- **FE → BE**: Provider-specific data
- **BE → FE**: `{ success }`

---

## 📮 Addresses (`/addresses`)

### GET `/`
- **Fonksiyon**: `listAddressesController`
- **FE → BE**: -
- **BE → FE**: `{ addresses[] }`

### GET `/default`
- **Fonksiyon**: `getDefaultAddressController`
- **FE → BE**: -
- **BE → FE**: `{ id, title, firstName, lastName, address, city, isDefault }`

### GET `/:id`
- **Fonksiyon**: `getAddressController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ id, title, firstName, lastName, phone, address, city, district, postalCode, isDefault }`

### POST `/`
- **Fonksiyon**: `createAddressController`
- **FE → BE**: `{ title, firstName, lastName, phone, address, city, district?, state?, country, postalCode, isDefault? }`
- **BE → FE**: `{ id, title, firstName, lastName, address, city, isDefault, createdAt }`

### PUT `/:id`
- **Fonksiyon**: `updateAddressController`
- **FE → BE**: `{ title?, firstName?, lastName?, phone?, address?, city?, district?, postalCode?, isDefault? }`
- **BE → FE**: `{ id, title, firstName, lastName, address, updatedAt }`

### POST `/:id/default`
- **Fonksiyon**: `setDefaultAddressController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ message, addressId, isDefault }`

### DELETE `/:id`
- **Fonksiyon**: `deleteAddressController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ message, deletedId }`

---

## 📄 Templates (`/templates`)

### GET `/`
- **Fonksiyon**: `listTemplatesController`
- **FE → BE**: Query: `category?, search?, tags?, page?, limit?, sortBy?`
- **BE → FE**: `{ templates[], pagination }`

### GET `/popular`
- **Fonksiyon**: `getPopularTemplatesController`
- **FE → BE**: Query: `limit?`
- **BE → FE**: `{ templates[] }`

### GET `/slug/:slug`
- **Fonksiyon**: `getTemplateBySlugController`
- **FE → BE**: Params: `slug`
- **BE → FE**: `{ id, name, slug, description, previewImages[], features[], customizableElements[], dimensions, fileFormats[], category, tags[], isPremium, price, designer, usageCount, rating }`

### GET `/:id`
- **Fonksiyon**: `getTemplateByIdController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ id, name, slug, description, ... }` (aynı yapı)

### POST `/`
- **Fonksiyon**: `createTemplateController`
- **FE → BE**: `{ name, description, categoryId, previewImage, tags?, isPremium?, price? }`
- **BE → FE**: `{ id, name, slug, category, isPremium, price, createdAt }`

### PUT `/:id`
- **Fonksiyon**: `updateTemplateController`
- **FE → BE**: `{ name?, description?, previewImage?, tags?, isPremium?, price? }`
- **BE → FE**: `{ id, name, slug, updatedAt }`

### DELETE `/:id`
- **Fonksiyon**: `deleteTemplateController` (🔐 Admin)
- **FE → BE**: Params: `id`
- **BE → FE**: `{ message }`

---

## 📂 Categories (`/categories`)

### GET `/`
- **Fonksiyon**: `listCategoriesController`
- **FE → BE**: -
- **BE → FE**: `{ categories[] }`

### GET `/:id`
- **Fonksiyon**: `getCategoryController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ id, name, slug, description, icon, coverImage, templateCount, designerCount, popularTemplates[], topDesigners[], relatedCategories[] }`

### POST `/`
- **Fonksiyon**: `createCategoryController` (🔐 Admin)
- **FE → BE**: `{ name, slug, description?, icon?, coverImage? }`
- **BE → FE**: `{ id, name, slug, createdAt }`

### PUT `/:id`
- **Fonksiyon**: `updateCategoryController` (🔐 Admin)
- **FE → BE**: `{ name?, slug?, description?, icon?, coverImage? }`
- **BE → FE**: `{ id, name, slug, updatedAt }`

### DELETE `/:id`
- **Fonksiyon**: `deleteCategoryController` (🔐 Admin)
- **FE → BE**: Params: `id`
- **BE → FE**: `{ message }`

---

## 🔍 Search (`/search`)

### GET `/`
- **Fonksiyon**: `globalSearchController`
- **FE → BE**: Query: `q, type?, category?, tag?, page?, limit?`
- **BE → FE**: `{ query, results: { templates, designers, projects }, totalResults, searchTime }`

### GET `/suggestions`
- **Fonksiyon**: `searchSuggestionsController`
- **FE → BE**: Query: `q, limit?`
- **BE → FE**: `{ suggestions[] }`

---

## 🎨 AI (`/ai`)

### POST `/drafts/:id/ai/generate`
- **Fonksiyon**: `generateController`
- **FE → BE**: `{ prompt, coverType?, style?, aspectRatio? }`
- **BE → FE**: `{ jobId, status, message, estimatedTime, creditsUsed }`

### GET `/drafts/:id/ai/results`
- **Fonksiyon**: `resultsController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ status, results[], selectedResultId, totalResults }`

### POST `/drafts/:id/ai/select`
- **Fonksiyon**: `selectController`
- **FE → BE**: `{ resultId }`
- **BE → FE**: `{ message, selectedResult }`

### POST `/drafts/:id/ai/regen`
- **Fonksiyon**: `regenController`
- **FE → BE**: `{ modifications?, prompt? }`
- **BE → FE**: `{ jobId, status, creditsUsed }`

### GET `/ai/templates`
- **Fonksiyon**: `listTemplatesController`
- **FE → BE**: -
- **BE → FE**: `{ templates[] }`

### POST `/ai/templates/render`
- **Fonksiyon**: `renderTemplateController`
- **FE → BE**: `{ templateId, variables }`
- **BE → FE**: `{ renderedPrompt }`

### GET `/drafts/:id/ai/original/:imageKey`
- **Fonksiyon**: `(inline handler)`
- **FE → BE**: Params: `id, imageKey`
- **BE → FE**: PNG image file

---

## ❤️ Likes (`/likes`)

### POST `/toggle`
- **Fonksiyon**: `toggleLikeController`
- **FE → BE**: `{ messageCardId }`
- **BE → FE**: `{ liked, totalLikes, message }`

### GET `/cards/:id/summary`
- **Fonksiyon**: `getLikeSummaryController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ messageCardId, totalLikes, recentLikes }`

---

## 💬 Comments (`/comments`)

### GET `/`
- **Fonksiyon**: `listCommentsController`
- **FE → BE**: Query: `projectId, layerId?, status?, page?, limit?`
- **BE → FE**: `{ comments[], pagination }`

### GET `/projects/:projectId/stats`
- **Fonksiyon**: `getProjectStatsController`
- **FE → BE**: Params: `projectId`
- **BE → FE**: `{ total, open, resolved, averageRating }`

### GET `/:id`
- **Fonksiyon**: `getCommentController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ id, projectId, layerId, authorId, authorName, body, status, rating, createdAt, updatedAt }`

### POST `/`
- **Fonksiyon**: `createCommentController`
- **FE → BE**: `{ projectId, body, targetLayerId?, rating? }`
- **BE → FE**: `{ id, projectId, body, status, createdAt }`

### PUT `/:id`
- **Fonksiyon**: `updateCommentController`
- **FE → BE**: `{ body?, status?, rating? }`
- **BE → FE**: `{ id, body, status, updatedAt }`

### DELETE `/:id`
- **Fonksiyon**: `deleteCommentController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ message }`

---

## 🔔 Notifications (`/notifications`)

### GET `/`
- **Fonksiyon**: `listMyNotificationsController`
- **FE → BE**: Query: `read?, page?, limit?`
- **BE → FE**: `{ notifications[], unreadCount, pagination }`

### PUT `/:id/read`
- **Fonksiyon**: `markNotificationAsReadController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ message, readAt }`

### PUT `/mark-all-read`
- **Fonksiyon**: `markAllAsReadController`
- **FE → BE**: -
- **BE → FE**: `{ message, count }`

### DELETE `/:id`
- **Fonksiyon**: `deleteNotificationController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ message }`

---

## 💌 Message Cards (`/message-cards`)

### GET `/`
- **Fonksiyon**: `listMessageCardsController`
- **FE → BE**: -
- **BE → FE**: `{ messageCards[] }`

### GET `/popular`
- **Fonksiyon**: `popularMessageCardsController`
- **FE → BE**: -
- **BE → FE**: `{ messageCards[] }`

---

## 📁 Projects (`/projects`)

### GET `/`
- **Fonksiyon**: `listProjectsController`
- **FE → BE**: -
- **BE → FE**: `{ projects[] }`

### POST `/`
- **Fonksiyon**: `createProjectController`
- **FE → BE**: `{ name, description? }`
- **BE → FE**: `{ id, name, description, ownerId, status, createdAt }`

### GET `/:id`
- **Fonksiyon**: `getProjectController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ id, name, description, ownerId, status, members[], createdAt }`

### PUT `/:id`
- **Fonksiyon**: `updateProjectController`
- **FE → BE**: `{ name?, description? }`
- **BE → FE**: `{ id, name, description, updatedAt }`

### DELETE `/:id`
- **Fonksiyon**: `deleteProjectController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ message }`

### GET `/:id/members`
- **Fonksiyon**: `listMembersController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ members[] }`

### POST `/:id/members`
- **Fonksiyon**: `addMemberController`
- **FE → BE**: `{ userId, role? }`
- **BE → FE**: `{ message, member }`

### DELETE `/:id/members/:userId`
- **Fonksiyon**: `removeMemberController`
- **FE → BE**: Params: `id, userId`
- **BE → FE**: `{ message }`

---

## 🏢 Organizations (`/organizations`)

### GET `/`
- **Fonksiyon**: `listMyOrganizationsController`
- **FE → BE**: -
- **BE → FE**: `{ organizations[] }`

### GET `/:id`
- **Fonksiyon**: `getOrganizationController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ id, name, description, ownerId, members[], createdAt }`

### POST `/`
- **Fonksiyon**: `createOrganizationController`
- **FE → BE**: `{ name, description? }`
- **BE → FE**: `{ id, name, description, ownerId, createdAt }`

### PUT `/:id`
- **Fonksiyon**: `updateOrganizationController`
- **FE → BE**: `{ name?, description? }`
- **BE → FE**: `{ id, name, description, updatedAt }`

### DELETE `/:id`
- **Fonksiyon**: `deleteOrganizationController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ message }`

### POST `/:id/members`
- **Fonksiyon**: `addMemberController`
- **FE → BE**: `{ userId, role }`
- **BE → FE**: `{ message, member }`

### PUT `/:id/members/:userId`
- **Fonksiyon**: `updateMemberRoleController`
- **FE → BE**: `{ role }`
- **BE → FE**: `{ message, member }`

### DELETE `/:id/members/:userId`
- **Fonksiyon**: `removeMemberController`
- **FE → BE**: Params: `id, userId`
- **BE → FE**: `{ message }`

---

## 🔄 Returns (`/returns`)

### GET `/`
- **Fonksiyon**: `listMyReturnsController`
- **FE → BE**: -
- **BE → FE**: `{ returns[] }`

### POST `/`
- **Fonksiyon**: `createReturnController`
- **FE → BE**: `{ orderId, reason, images? }`
- **BE → FE**: `{ id, orderId, status, reason, requestedAt, estimatedProcessTime }`

### PUT `/:id/cancel`
- **Fonksiyon**: `cancelReturnController` 
- **FE → BE**: Params: `id`
- **BE → FE**: `{ message, status }`

### GET `/:id/tracking`
- **Fonksiyon**: `getReturnTrackingController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ returnId, status, trackingInfo, estimatedProcessTime }`

### PUT `/:id/status`
- **Fonksiyon**: `updateReturnStatusController` (🔐 Admin)
- **FE → BE**: `{ status }`
- **BE → FE**: `{ id, status, updatedAt }`

---

## 📧 Contact (`/contact`)

### POST `/`
- **Fonksiyon**: `contactController`
- **FE → BE**: `{ name, email, subject, message, phone? }`
- **BE → FE**: `{ message, submissionId, estimatedResponseTime }`

### GET `/submissions`
- **Fonksiyon**: `getSubmissionsController` (🔐 Admin)
- **FE → BE**: Query: `status?, page?, limit?`
- **BE → FE**: `{ submissions[], pagination }`

### PATCH `/submissions/:id`
- **Fonksiyon**: `updateSubmissionController` (🔐 Admin)
- **FE → BE**: `{ status, notes? }`
- **BE → FE**: `{ message }`

---

## 📎 Assets (`/assets`)

### GET `/`
- **Fonksiyon**: `listMyAssetsController`
- **FE → BE**: -
- **BE → FE**: `{ assets[] }`

### GET `/stats`
- **Fonksiyon**: `getStorageStatsController`
- **FE → BE**: -
- **BE → FE**: `{ totalAssets, totalSize, usedSpace, availableSpace, quota }`

### GET `/:id`
- **Fonksiyon**: `getAssetController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ id, type, name, url, size, mimeType, createdAt }`

### DELETE `/:id`
- **Fonksiyon**: `deleteAssetController`
- **FE → BE**: Params: `id`
- **BE → FE**: `{ message }`



## 📌 Notlar

- **Auth**: ✅ = Token gerekli, 🔓 = Public endpoint
- **Admin**: 🔐 = Sadece admin erişebilir
- **Rate Limits**: Her modülün kendi rate limit ayarları var
- **CSRF Token**: POST/PUT/DELETE isteklerinde `X-CSRF-Token` header'ı gerekli
- **Pagination**: Çoğu liste endpoint'i `page` ve `limit` query parametrelerini destekler

---


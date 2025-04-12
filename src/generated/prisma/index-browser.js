
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.CacheScalarFieldEnum = {
  key: 'key',
  value: 'value',
  expiration: 'expiration'
};

exports.Prisma.Cache_locksScalarFieldEnum = {
  key: 'key',
  owner: 'owner',
  expiration: 'expiration'
};

exports.Prisma.CategoriesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  parent_id: 'parent_id',
  created_by: 'created_by',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Conversation_membersScalarFieldEnum = {
  id: 'id',
  conversation_id: 'conversation_id',
  user_id: 'user_id',
  member_role: 'member_role',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.ConversationsScalarFieldEnum = {
  id: 'id',
  title: 'title',
  course_id: 'course_id',
  type: 'type',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.CoursesScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  category_id: 'category_id',
  user_id: 'user_id',
  price: 'price',
  discount_price: 'discount_price',
  thumbnail_url: 'thumbnail_url',
  duration: 'duration',
  level: 'level',
  requirements: 'requirements',
  objectives: 'objectives',
  status: 'status',
  rating: 'rating',
  enrollment_count: 'enrollment_count',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.EnrollmentsScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  course_id: 'course_id',
  expiry_date: 'expiry_date',
  payment_status: 'payment_status',
  payment_method: 'payment_method',
  transaction_id: 'transaction_id',
  price: 'price',
  status: 'status',
  completion_date: 'completion_date',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Failed_jobsScalarFieldEnum = {
  id: 'id',
  uuid: 'uuid',
  connection: 'connection',
  queue: 'queue',
  payload: 'payload',
  exception: 'exception',
  failed_at: 'failed_at'
};

exports.Prisma.Job_batchesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  total_jobs: 'total_jobs',
  pending_jobs: 'pending_jobs',
  failed_jobs: 'failed_jobs',
  failed_job_ids: 'failed_job_ids',
  options: 'options',
  cancelled_at: 'cancelled_at',
  created_at: 'created_at',
  finished_at: 'finished_at'
};

exports.Prisma.JobsScalarFieldEnum = {
  id: 'id',
  queue: 'queue',
  payload: 'payload',
  attempts: 'attempts',
  reserved_at: 'reserved_at',
  available_at: 'available_at',
  created_at: 'created_at'
};

exports.Prisma.LessonsScalarFieldEnum = {
  id: 'id',
  course_id: 'course_id',
  title: 'title',
  description: 'description',
  content: 'content',
  video_url: 'video_url',
  duration: 'duration',
  order_number: 'order_number',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.MaterialsScalarFieldEnum = {
  id: 'id',
  lesson_id: 'lesson_id',
  title: 'title',
  file_url: 'file_url',
  file_type: 'file_type',
  file_size: 'file_size',
  description: 'description',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.MessagesScalarFieldEnum = {
  id: 'id',
  conversation_id: 'conversation_id',
  user_id: 'user_id',
  content: 'content',
  attachment_url: 'attachment_url',
  attachment_type: 'attachment_type',
  is_read: 'is_read',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.MigrationsScalarFieldEnum = {
  id: 'id',
  migration: 'migration',
  batch: 'batch'
};

exports.Prisma.NotificationsScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  title: 'title',
  content: 'content',
  type: 'type',
  reference_id: 'reference_id',
  reference_type: 'reference_type',
  is_read: 'is_read',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Password_reset_codesScalarFieldEnum = {
  id: 'id',
  email: 'email',
  code: 'code',
  expires_at: 'expires_at',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Password_reset_tokensScalarFieldEnum = {
  email: 'email',
  token: 'token',
  created_at: 'created_at'
};

exports.Prisma.PaymentsScalarFieldEnum = {
  id: 'id',
  invoice_code: 'invoice_code',
  enrollment_id: 'enrollment_id',
  user_id: 'user_id',
  amount: 'amount',
  payment_method: 'payment_method',
  transaction_id: 'transaction_id',
  status: 'status',
  billing_info: 'billing_info',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.PermissionsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  category: 'category',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Personal_access_tokensScalarFieldEnum = {
  id: 'id',
  tokenable_id: 'tokenable_id',
  tokenable_type: 'tokenable_type',
  name: 'name',
  token: 'token',
  abilities: 'abilities',
  last_used_at: 'last_used_at',
  expires_at: 'expires_at',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.ProgressScalarFieldEnum = {
  id: 'id',
  enrollment_id: 'enrollment_id',
  lesson_id: 'lesson_id',
  status: 'status',
  start_date: 'start_date',
  completion_date: 'completion_date',
  last_access_date: 'last_access_date',
  time_spent: 'time_spent',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.ReviewsScalarFieldEnum = {
  id: 'id',
  enrollment_id: 'enrollment_id',
  rating: 'rating',
  comment: 'comment',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Role_userScalarFieldEnum = {
  user_id: 'user_id',
  role_id: 'role_id',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.RolesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.SessionsScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  ip_address: 'ip_address',
  user_agent: 'user_agent',
  payload: 'payload',
  last_activity: 'last_activity'
};

exports.Prisma.Social_accountsScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  provider_name: 'provider_name',
  provider_id: 'provider_id',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.UsersScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  email_verified_at: 'email_verified_at',
  avatar: 'avatar',
  password: 'password',
  remember_token: 'remember_token',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.cacheOrderByRelevanceFieldEnum = {
  key: 'key',
  value: 'value'
};

exports.Prisma.cache_locksOrderByRelevanceFieldEnum = {
  key: 'key',
  owner: 'owner'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.categoriesOrderByRelevanceFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  parent_id: 'parent_id',
  created_by: 'created_by'
};

exports.Prisma.conversation_membersOrderByRelevanceFieldEnum = {
  id: 'id',
  conversation_id: 'conversation_id',
  user_id: 'user_id'
};

exports.Prisma.conversationsOrderByRelevanceFieldEnum = {
  id: 'id',
  title: 'title',
  course_id: 'course_id'
};

exports.Prisma.coursesOrderByRelevanceFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  category_id: 'category_id',
  user_id: 'user_id',
  thumbnail_url: 'thumbnail_url',
  requirements: 'requirements',
  objectives: 'objectives'
};

exports.Prisma.enrollmentsOrderByRelevanceFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  course_id: 'course_id',
  transaction_id: 'transaction_id'
};

exports.Prisma.failed_jobsOrderByRelevanceFieldEnum = {
  uuid: 'uuid',
  connection: 'connection',
  queue: 'queue',
  payload: 'payload',
  exception: 'exception'
};

exports.Prisma.job_batchesOrderByRelevanceFieldEnum = {
  id: 'id',
  name: 'name',
  failed_job_ids: 'failed_job_ids',
  options: 'options'
};

exports.Prisma.jobsOrderByRelevanceFieldEnum = {
  queue: 'queue',
  payload: 'payload'
};

exports.Prisma.lessonsOrderByRelevanceFieldEnum = {
  id: 'id',
  course_id: 'course_id',
  title: 'title',
  description: 'description',
  content: 'content',
  video_url: 'video_url'
};

exports.Prisma.materialsOrderByRelevanceFieldEnum = {
  id: 'id',
  lesson_id: 'lesson_id',
  title: 'title',
  file_url: 'file_url',
  file_type: 'file_type',
  description: 'description'
};

exports.Prisma.messagesOrderByRelevanceFieldEnum = {
  id: 'id',
  conversation_id: 'conversation_id',
  user_id: 'user_id',
  content: 'content',
  attachment_url: 'attachment_url',
  attachment_type: 'attachment_type'
};

exports.Prisma.migrationsOrderByRelevanceFieldEnum = {
  migration: 'migration'
};

exports.Prisma.notificationsOrderByRelevanceFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  title: 'title',
  content: 'content',
  reference_type: 'reference_type'
};

exports.Prisma.password_reset_codesOrderByRelevanceFieldEnum = {
  email: 'email',
  code: 'code'
};

exports.Prisma.password_reset_tokensOrderByRelevanceFieldEnum = {
  email: 'email',
  token: 'token'
};

exports.Prisma.paymentsOrderByRelevanceFieldEnum = {
  id: 'id',
  invoice_code: 'invoice_code',
  enrollment_id: 'enrollment_id',
  user_id: 'user_id',
  transaction_id: 'transaction_id',
  billing_info: 'billing_info'
};

exports.Prisma.permissionsOrderByRelevanceFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  category: 'category'
};

exports.Prisma.personal_access_tokensOrderByRelevanceFieldEnum = {
  tokenable_id: 'tokenable_id',
  tokenable_type: 'tokenable_type',
  name: 'name',
  token: 'token',
  abilities: 'abilities'
};

exports.Prisma.progressOrderByRelevanceFieldEnum = {
  id: 'id',
  enrollment_id: 'enrollment_id',
  lesson_id: 'lesson_id'
};

exports.Prisma.reviewsOrderByRelevanceFieldEnum = {
  id: 'id',
  enrollment_id: 'enrollment_id',
  comment: 'comment'
};

exports.Prisma.role_userOrderByRelevanceFieldEnum = {
  user_id: 'user_id',
  role_id: 'role_id'
};

exports.Prisma.rolesOrderByRelevanceFieldEnum = {
  id: 'id',
  name: 'name'
};

exports.Prisma.sessionsOrderByRelevanceFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  ip_address: 'ip_address',
  user_agent: 'user_agent',
  payload: 'payload'
};

exports.Prisma.social_accountsOrderByRelevanceFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  provider_name: 'provider_name',
  provider_id: 'provider_id'
};

exports.Prisma.usersOrderByRelevanceFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  avatar: 'avatar',
  password: 'password',
  remember_token: 'remember_token'
};
exports.categories_status = exports.$Enums.categories_status = {
  Active: 'Active',
  Inactive: 'Inactive'
};

exports.conversation_members_member_role = exports.$Enums.conversation_members_member_role = {
  Admin: 'Admin',
  Member: 'Member'
};

exports.conversation_members_status = exports.$Enums.conversation_members_status = {
  Active: 'Active',
  Muted: 'Muted',
  Left: 'Left'
};

exports.conversations_type = exports.$Enums.conversations_type = {
  Course: 'Course',
  Private: 'Private',
  Group: 'Group'
};

exports.conversations_status = exports.$Enums.conversations_status = {
  Active: 'Active',
  Archived: 'Archived'
};

exports.courses_level = exports.$Enums.courses_level = {
  Beginner: 'Beginner',
  Intermediate: 'Intermediate',
  Advanced: 'Advanced',
  All_Levels: 'All_Levels'
};

exports.courses_status = exports.$Enums.courses_status = {
  Draft: 'Draft',
  Published: 'Published',
  Archived: 'Archived'
};

exports.enrollments_payment_status = exports.$Enums.enrollments_payment_status = {
  Pending: 'Pending',
  Completed: 'Completed',
  Failed: 'Failed',
  Refunded: 'Refunded'
};

exports.enrollments_payment_method = exports.$Enums.enrollments_payment_method = {
  Momo: 'Momo',
  Bank: 'Bank',
  Paypal: 'Paypal',
  Cash: 'Cash'
};

exports.enrollments_status = exports.$Enums.enrollments_status = {
  Pending: 'Pending',
  Active: 'Active',
  Completed: 'Completed',
  Cancelled: 'Cancelled'
};

exports.lessons_status = exports.$Enums.lessons_status = {
  Draft: 'Draft',
  Published: 'Published',
  Archived: 'Archived'
};

exports.messages_status = exports.$Enums.messages_status = {
  Sent: 'Sent',
  Delivered: 'Delivered',
  Read: 'Read',
  Deleted: 'Deleted'
};

exports.notifications_type = exports.$Enums.notifications_type = {
  System: 'System',
  Course: 'Course',
  Payment: 'Payment',
  Message: 'Message'
};

exports.notifications_status = exports.$Enums.notifications_status = {
  Active: 'Active',
  Archived: 'Archived',
  Deleted: 'Deleted'
};

exports.payments_payment_method = exports.$Enums.payments_payment_method = {
  Momo: 'Momo',
  Bank: 'Bank',
  Paypal: 'Paypal',
  Cash: 'Cash'
};

exports.payments_status = exports.$Enums.payments_status = {
  Pending: 'Pending',
  Completed: 'Completed',
  Failed: 'Failed',
  Refunded: 'Refunded'
};

exports.permissions_status = exports.$Enums.permissions_status = {
  Active: 'Active',
  Inactive: 'Inactive'
};

exports.progress_status = exports.$Enums.progress_status = {
  Not_Started: 'Not_Started',
  In_Progress: 'In_Progress',
  Completed: 'Completed'
};

exports.reviews_status = exports.$Enums.reviews_status = {
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected'
};

exports.Prisma.ModelName = {
  cache: 'cache',
  cache_locks: 'cache_locks',
  categories: 'categories',
  conversation_members: 'conversation_members',
  conversations: 'conversations',
  courses: 'courses',
  enrollments: 'enrollments',
  failed_jobs: 'failed_jobs',
  job_batches: 'job_batches',
  jobs: 'jobs',
  lessons: 'lessons',
  materials: 'materials',
  messages: 'messages',
  migrations: 'migrations',
  notifications: 'notifications',
  password_reset_codes: 'password_reset_codes',
  password_reset_tokens: 'password_reset_tokens',
  payments: 'payments',
  permissions: 'permissions',
  personal_access_tokens: 'personal_access_tokens',
  progress: 'progress',
  reviews: 'reviews',
  role_user: 'role_user',
  roles: 'roles',
  sessions: 'sessions',
  social_accounts: 'social_accounts',
  users: 'users'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)

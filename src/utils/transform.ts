/**
 * Transform snake_case keys to camelCase recursively
 */
export const toCamelCase = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const transformed: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        transformed[camelKey] = toCamelCase(obj[key]);
      }
    }
    
    return transformed;
  }

  return obj;
};

/**
 * Transform specific database objects to API format
 */
export const transformUser = (user: any) => ({
  id: user.id,
  email: user.email,
  fullName: user.full_name,
  phoneNumber: user.phone_number,
  profilePictureUrl: user.profile_picture_url,
  isVerified: user.is_verified,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

export const transformProduct = (product: any) => ({
  id: product.id,
  barcode: product.barcode,
  name: product.name,
  imageUrl: product.image_url,
  nutritionalScore: product.nutritional_score,
  scanCount: product._count?.product_scans || product.scan_count || 0,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt
});

export const transformScan = (scan: any) => ({
  id: scan.id,
  userId: scan.user_id,
  productId: scan.product_id,
  riskLevel: scan.risk_level,
  riskExplanation: scan.risk_explanation,
  matchedAllergens: scan.matched_allergens,
  scanDate: scan.scan_date,
  isSaved: scan.is_saved,
  product: scan.product ? transformProduct(scan.product) : undefined
});

export const transformSubscription = (subscription: any) => ({
  id: subscription.id,
  userId: subscription.user_id,
  tierPlan: subscription.tier_plan ? {
    id: subscription.tier_plan.id,
    planType: subscription.tier_plan.plan_type,
    scanCountLimit: subscription.tier_plan.scan_count_limit,
    savedProductLimit: subscription.tier_plan.saved_product_limit
  } : undefined,
  startDate: subscription.start_date,
  endDate: subscription.end_date,
  status: subscription.status,
  createdAt: subscription.createdAt,
  updatedAt: subscription.updatedAt
});

export const transformEmergencyContact = (contact: any) => ({
  id: contact.id,
  userId: contact.user_id,
  name: contact.name,
  phoneNumber: contact.phone_number,
  relationship: contact.relationship,
  isMain: contact.is_main,
  createdAt: contact.createdAt,
  updatedAt: contact.updatedAt
});

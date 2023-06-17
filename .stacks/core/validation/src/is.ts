import { currency, getTypeName, toString } from '@stacksjs/utils'
import type { HashAlgorithm } from '@stacksjs/types'
import { validator } from '@stacksjs/validation'
import v from 'validator'
import { USD } from '@dinero.js/currencies'
import type { FieldContext } from '@vinejs/vine/build/src/types'

export const isMoney = validator.createRule((value: unknown, _, field: FieldContext) => {
  /**
   * Convert string representation of a number to a JavaScript
   * Number data type.
   */
  const numericValue = validator.helpers.asNumber(value)

  /**
   * Report error, if the value is NaN post-conversion
   */
  if (Number.isNaN(numericValue)) {
    field.report(
      'The {{ field }} field value must be a number',
      'money',
      field,
    )
    return
  }

  /**
   * Create amount type
   */
  const amount = currency({ amount: numericValue, currency: USD })

  /**
   * Mutate the field's value
   */
  field.mutate(amount, field)
})

export function isEmail(email: string) {
  return validator.helpers.isEmail(email)
}

export function isStrongPassword(password: string) {
  return v.isStrongPassword(password)
}

export function isAlphanumeric(username: string) {
  return v.isAlphanumeric(username)
}

export function validateUsername(username: string) {
  return isAlphanumeric(username)
}

export function isURL(url: string) {
  return validator.helpers.isURL(url)
}

export function isMobilePhone(phoneNumber: string) {
  return validator.helpers.isMobilePhone(phoneNumber)
}

export function isAlpha(name: string) {
  return validator.helpers.isAlpha(name)
}

export function isPostalCode(zipCode: string) {
  return validator.helpers.isPostalCode(zipCode, 'any')
}

export function isNumeric(number: string) {
  return validator.helpers.isNumeric(number)
}

export function isHexColor(color: string) {
  return validator.helpers.isHexColor(color)
}

export function isHexadecimal(hex: string) {
  return v.isHexadecimal(hex)
}

export function isBase64(base64: string) {
  return v.isBase64(base64)
}

export function isUUID(uuid: string) {
  return validator.helpers.isUUID(uuid)
}

export function isJSON(json: string) {
  return v.isJSON(json)
}

export function isCreditCard(creditCard: string) {
  return validator.helpers.isCreditCard(creditCard)
}

export function isISBN(isbn: string) {
  return v.isISBN(isbn)
}

export function isIP(ip: string) {
  return validator.helpers.isIP(ip)
}

export function isIPRange(ip: string) {
  return v.isIPRange(ip)
}

export function isMACAddress(macAddress: string) {
  return v.isMACAddress(macAddress)
}

export function isLatLong(latitude: string) {
  return validator.helpers.isLatLong(latitude)
}

export function isLatitude(longitude: string) {
  return validator.helpers.isLatLong(longitude)
}

export function isLongitude(longitude: string) {
  return validator.helpers.isLatLong(longitude)
}

export function isCurrency(currency: string) {
  return v.isCurrency(currency)
}

export function isDataURI(dataURI: string) {
  return v.isDataURI(dataURI)
}

export function isMimeType(mimeType: string) {
  return v.isMimeType(mimeType)
}

export function isJWT(jwt: string) {
  return validator.helpers.isJWT(jwt)
}

export function isAscii(ascii: string) {
  return validator.helpers.isAscii(ascii)
}

export function isBase32(base32: string) {
  return v.isBase32(base32)
}

export function isByteLength(byteLength: string) {
  return v.isByteLength(byteLength)
}

export function isFQDN(fqdn: string) {
  return v.isFQDN(fqdn)
}

export function isFullWidth(fullWidth: string) {
  return v.isFullWidth(fullWidth)
}

export function isHalfWidth(halfWidth: string) {
  return v.isHalfWidth(halfWidth)
}

export function isHash(hash: string, algorithm: HashAlgorithm) {
  return v.isHash(hash, algorithm)
}

export function isHSL(hsl: string) {
  return v.isHSL(hsl)
}

export function isIBAN(iban: string) {
  return v.isIBAN(iban)
}

export function isIdentityCard(identityCard: string) {
  return v.isIdentityCard(identityCard)
}

export function isISIN(isin: string) {
  return v.isISIN(isin)
}

export function isISO8601(iso8601: string) {
  return v.isISO8601(iso8601)
}

export function isISRC(isrc: string) {
  return v.isISRC(isrc)
}

export function isISSN(issn: string) {
  return v.isISSN(issn)
}

export function isISO31661Alpha2(iso31661Alpha2: string) {
  return v.isISO31661Alpha2(iso31661Alpha2)
}

export function isISO31661Alpha3(iso31661Alpha3: string) {
  return v.isISO31661Alpha3(iso31661Alpha3)
}

export function isDef<T = any>(val?: T): val is T {
  return typeof val !== 'undefined'
}
export function isBoolean(val: any): val is boolean {
  return typeof val === 'boolean'
}
export function isFunction<T extends Function>(val: any): val is T {
  return typeof val === 'function'
}
export function isNumber(val: any): val is number {
  return typeof val === 'number'
}
export function isString(val: unknown): val is string {
  return typeof val === 'string'
}
export function isObject(val: any): val is object {
  return toString(val) === '[object Object]'
}
export function isWindow(val: any): boolean {
  return typeof window !== 'undefined' && toString(val) === '[object Window]'
}
export const isBrowser = typeof window !== 'undefined'
export const isServer = typeof document === 'undefined' // https://remix.run/docs/en/v1/pages/gotchas#typeof-window-checks
export function isMap(val: any): val is Map<any, any> {
  return toString(val) === '[object Map]'
}
export function isSet(val: any): val is Set<any> {
  return toString(val) === '[object Set]'
}
export function isPromise<T = any>(val: any): val is Promise<T> {
  return toString(val) === '[object Promise]'
}
export function isUndefined(v: any) {
  return getTypeName(v) === 'undefined'
}
export function isNull(v: any) {
  return getTypeName(v) === 'null'
}
export function isSymbol(v: any) {
  return getTypeName(v) === 'symbol'
}
export function isDate(v: any) {
  return getTypeName(v) === 'date'
}
export function isRegExp(v: any) {
  return getTypeName(v) === 'regexp'
}
export function isArray(v: any) {
  return getTypeName(v) === 'array'
}
export function isPrimitive(v: any) {
  const type = getTypeName(v)
  return type === 'null' || type === 'undefined' || type === 'string' || type === 'number' || type === 'boolean' || type === 'symbol'
}
export function isInteger(v: any) {
  return isNumber(v) && Number.isInteger(v)
}
export function isFloat(v: any) {
  return isNumber(v) && !Number.isInteger(v)
}
export function isPositive(v: any) {
  return isNumber(v) && v > 0
}
export function isNegative(v: any) {
  return isNumber(v) && v < 0
}
export function isEven(v: any) {
  return isNumber(v) && v % 2 === 0
}
export function isOdd(v: any) {
  return isNumber(v) && v % 2 !== 0
}
export function isEvenOrOdd(v: any) {
  return isNumber(v) && (v % 2 === 0 ? 'even' : 'odd')
}
export function isPositiveOrNegative(v: any) {
  return isNumber(v) && (v > 0 ? 'positive' : 'negative')
}
export function isIntegerOrFloat(v: any) {
  return isNumber(v) && (Number.isInteger(v) ? 'integer' : 'float')
}

const FormData = require("./support/fake-form-data.cjs")
const FormDataObjectizer = require("../index.cjs")

function formDataWithEntries(entries) {
  return {
    entries() {
      return entries
    }
  }
}

function expectUnsafeFormKey(formKey, unsafeKeySegment) {
  const formData = formDataWithEntries([[formKey, "yes"]])

  expect(() => FormDataObjectizer.toObject(formData)).toThrowError(Error, `Unsafe form key segment: ${unsafeKeySegment}`)
}

describe("form-data-objectizer", () => {
  afterEach(() => {
    delete Object.prototype.polluted
  })

  it("converts nested keys", () => {
    const formData = new FormData()

    formData.append("model_search[global]", "0")
    formData.append("model_search[model_search_group_attributes][group_mode]", "and")
    formData.append("model_search[model_search_group_attributes][model_search_rules_attributes][700865670245722100][rule_attribute]", "id")

    const object = FormDataObjectizer.toObject(formData)

    expect(object).toEqual({
      model_search: {
        global: "0",
        model_search_group_attributes: {
          group_mode: "and",
          model_search_rules_attributes: {
            700865670245722100: {
              rule_attribute: "id"
            }
          }
        }
      }
    })
  })

  it("rejects __proto__ bracket keys without polluting Object.prototype", () => {
    expectUnsafeFormKey("__proto__[polluted]", "__proto__")
    expect({}.polluted).toBeUndefined()
  })

  it("rejects constructor prototype bracket keys without polluting Object.prototype", () => {
    expectUnsafeFormKey("constructor[prototype][polluted]", "constructor")
    expect({}.polluted).toBeUndefined()
  })

  it("rejects unsafe direct keys", () => {
    for (const key of ["__proto__", "constructor", "prototype"]) {
      expectUnsafeFormKey(key, key)
    }
  })

  it("rejects unsafe nested keys", () => {
    for (const key of ["__proto__", "constructor", "prototype"]) {
      expectUnsafeFormKey(`user[${key}][polluted]`, key)
    }
  })

  it("parses inherited non-reserved names as own properties", () => {
    const formData = formDataWithEntries([["toString[value]", "yes"]])

    const object = FormDataObjectizer.toObject(formData)

    expect(object).toEqual({
      toString: {
        value: "yes"
      }
    })
  })
})

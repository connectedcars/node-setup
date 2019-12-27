function shouldBeString(value: string) {
  return value == 'hello'
}

describe('features', () => {
  it('Nullish coalescing operator', () => {
    const test: string | null = null
    expect(shouldBeString(test ?? 'hello')).toBeTruthy()
  })

  it('Optional chaining', () => {
    const test = { hello: { hello: 'hello' } }
    expect(shouldBeString(test?.hello?.hello)).toBeTruthy()
  })

  it('Numeric separator', () => {
    expect(100_000).toEqual(100000)
  })
})

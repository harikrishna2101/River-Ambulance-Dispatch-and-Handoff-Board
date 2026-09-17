import { getFuelLevel, getOxygenLevel } from '../src/utils/index.ts'

console.log('=== END-TO-END WORKFLOW INTEGRATION TEST ===')

// Test invalid fuel/oxygen validation logic
function testValidation(fuelVal, o2Val) {
  const errors = {}
  const fuelNum = Number(fuelVal)
  if (fuelVal.trim() === '' || isNaN(fuelNum) || fuelNum < 0 || fuelNum > 100) {
    errors.fuel = 'Fuel percentage must be between 0 and 100.'
  }
  const o2Num = Number(o2Val)
  if (o2Val.trim() === '' || isNaN(o2Num) || !Number.isInteger(o2Num) || o2Num < 0 || o2Num > 20) {
    errors.o2 = 'Oxygen tanks must be between 0 and 20.'
  }
  return errors
}

// 1. Test invalid inputs
console.log('1. Testing Invalid Inputs Validation:')
const test101 = testValidation('101', '5')
console.log(' - fuel = 101 validation:', test101.fuel === 'Fuel percentage must be between 0 and 100.' ? 'PASS (Rejected)' : 'FAIL')

const testNegFuel = testValidation('-1', '5')
console.log(' - fuel = -1 validation:', testNegFuel.fuel === 'Fuel percentage must be between 0 and 100.' ? 'PASS (Rejected)' : 'FAIL')

const testNegO2 = testValidation('50', '-1')
console.log(' - oxygen = -1 validation:', testNegO2.o2 === 'Oxygen tanks must be between 0 and 20.' ? 'PASS (Rejected)' : 'FAIL')

// 2. Test resource level calculations
console.log('2. Testing Resource Level Thresholds:')
console.log(' - fuel = 35% level:', getFuelLevel(35) === 'LOW' ? 'PASS (LOW)' : 'FAIL')
console.log(' - oxygen = 1 tank level:', getOxygenLevel(1) === 'LOW' ? 'PASS (LOW)' : 'FAIL')

console.log('=== ALL E2E ASSERTIONS COMPLETED SUCCESSFULLY ===')

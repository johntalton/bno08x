import { I2CAddressedBus } from '@johntalton/and-other-delights'

export const ADDRESS = 0x4A

export const SHTP_HEADER_LENGTH = 4
export const SHTP_INVALID_LENGTH = 0xFFFF

export const CHANNEL = {
	SHTP_COMMAND: 0,
	EXECUTABLE: 1,
	SENSOR_HUB_CONTROL: 2,
	INPUT_SENSOR_REPORT: 3,
	WAKE_INPUT_SENSOR_REPORT: 4,
	GYRO_ROTATION_VECTOR: 5
}

export const EXECUTION_MODE = {
	RESET: 1,
	ON: 2,
	SLEEP: 3
}

export const EXECUTION_MODE_RESPONSE = {
	RESET_COMPLETE: 1
}

export const CONTROL_COMMANDS_REPORT_ID = {
 GET_FEATURE_REQUEST: 0xFE, // Host to BNO
 SET_FEATURE_COMMAND: 0xFD,  // Host to BNO
 GET_FEATURE_RESPONSE: 0xFC, // BNO to host

 PRODUCT_ID_REQUEST: 0xF9, // Host to BNO
 PRODUCT_ID_RESPONSE: 0xF8, // BNO to host

 FRS_WRITE_REQUEST: 0xF7, // Host to BNO
 FRS_WRITE_DATA: 0xF6, // Host to BNO
 FRS_WRITE_RESPONSE: 0xF5, // BNO to Host

 FRS_READ_REQUEST: 0xF4, // Host to BNO
 FRS_READ_RESPONSE: 0xF3, // BNO to host

 COMMAND_REQUEST: 0xF2, // Host to BNO
 COMMAND_RESPONSE: 0xF1, // BNO to host
}



export class BNO08X {
	#bus

	static from(bus: I2CAddressedBus) {
		return new BNO08X(bus)
	}

	constructor(bus: I2CAddressedBus) {
		this.#bus = bus
	}

	get bus() { return this.#bus }

	async getAcceleration() {
		const block = await this.service()

		if(block.cargoLength === 0) {
			return block
		}


		return block
	}

	async service() {
		const result = await this.#bus.i2cRead(64)

		const dv = new DataView(result)
		const lengthLSB = dv.getUint8(0)
		const lengthMSB = dv.getUint8(1)
		const channel = dv.getUint8(2)
		const seqNum = dv.getUint8(3)


		const CONTINUATION_MASK = 0x8000  // 0b1 << 16
		const continuation = (lengthMSB &  CONTINUATION_MASK) === CONTINUATION_MASK
		const length = ((lengthMSB << 8) | lengthLSB) & ~CONTINUATION_MASK
		const valid = (length !== SHTP_INVALID_LENGTH) && (length < SHTP_INVALID_LENGTH)

		const cargoLength = length >= SHTP_HEADER_LENGTH ? length - SHTP_HEADER_LENGTH : 0

		const cargo = new DataView(result, SHTP_HEADER_LENGTH, result.byteLength - SHTP_HEADER_LENGTH)

		return {
			header: dv,
			cargo,
			valid,
			continuation,
			length,
			cargoLength,
			channel,
			seqNum
		}
	}
}

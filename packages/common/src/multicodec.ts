import { varint } from 'multiformats';

export type MulticodecCode = number;

export type MulticodecDefinition<MulticodecCode> = {
  code: MulticodecCode;
  // codeBytes: Uint8Array;
  name: string;
}

/**
 * The `Multicodec` class provides an interface to prepend binary data
 * with a prefix that identifies the data that follows.
 * https://github.com/multiformats/multicodec/blob/master/table.csv
 *
 * Multicodec is a self-describing multiformat, it wraps other formats with
 * a tiny bit of self-description. A multicodec identifier is a
 * varint (variable integer) that indicates the format of the data.
 *
 * The canonical table of multicodecs can be access at the following URL:
 * https://github.com/multiformats/multicodec/blob/master/table.csv
 *
 * Example usage:
 *
 * ```ts
 * Multicodec.registerCodec({ code: 0xed, name: 'ed25519-pub' });
 * const prefixedData = Multicodec.addPrefix({ code: 0xed, data: new Uint8Array(32) });
 * ```
 */
export class Multicodec {
  /**
   * A static field containing a map of codec codes to their corresponding names.
   */
  static codeToName = new Map<MulticodecCode, string>();

  /**
   * A static field containing a map of codec names to their corresponding codes.
   */
  static nameToCode = new Map<string, MulticodecCode>();

  /**
   * Adds a multicodec prefix to input data.
   *
   * @param options - The options for adding a prefix.
   * @param options.code - The codec code. Either the code or name must be provided.
   * @param options.name - The codec name. Either the code or name must be provided.
   * @param options.data - The data to be prefixed.
   * @returns The data with the added prefix as a Uint8Array.
   */
  public static addPrefix(options: {
    code?: MulticodecCode,
    data: Uint8Array,
    name?: string,
  }): Uint8Array {
    let { code, data, name } = options;

    // Either code or name must be specified, but not both.
    if (!(name ? !code : code)) {
      throw new Error(`Exactly one of 'name' or 'code' must be defined.`);
    }

    // If code was given, confirm it exists, or lookup code by name.
    code = Multicodec.codeToName.has(code!) ? code : Multicodec.nameToCode.get(name!);

    // Throw error if a registered Codec wasn't found.
    if (code === undefined) {
      throw new Error(`Multicodec not found: ${name ?? code}`);
    }

    // Create a new array to store the prefix and input data.
    const prefixLength = varint.encodingLength(code);
    const dataWithPrefix = new Uint8Array(prefixLength + data.byteLength);
    dataWithPrefix.set(data, prefixLength);

    // Prepend the prefix.
    varint.encodeTo(code, dataWithPrefix);

    return dataWithPrefix;
  }

  /**
   * Get the Multicodec code from given prefixed data.
   *
   * @param options - The options for getting the codec code.
   * @param options.prefixedData - The data to extract the codec code from.
   * @returns - The Multicodec code as a number.
   */
  public static getCodeFromData(options: {
    prefixedData: Uint8Array
  }): MulticodecCode {
    const { prefixedData } = options;
    const [code, _] = varint.decode(prefixedData);

    return code;
  }

  /**
   * Registers a new codec in the Multicodec class.
   *
   * @param codec - The codec to be registered.
   */
  public static registerCodec(codec: MulticodecDefinition<MulticodecCode>) {
    Multicodec.codeToName.set(codec.code, codec.name);
    Multicodec.nameToCode.set(codec.name, codec.code);
  }

  /**
   * Returns the data with the Multicodec prefix removed.
   *
   * @param refixedData - The data to extract the codec code from.
   * @returns {Uint8Array}
   */
  public static removePrefix(options: {
    prefixedData: Uint8Array
  }): Uint8Array {
    const { prefixedData } = options;
    const [_, codeByteLength] = varint.decode(prefixedData);
    return prefixedData.slice(codeByteLength);
  }
}

// Pre-defined registered codecs:
Multicodec.registerCodec({ code: 0xed, name: 'ed25519-pub' });
Multicodec.registerCodec({ code: 0x1300, name: 'ed25519-priv' });
Multicodec.registerCodec({ code: 0xec, name: 'x25519-pub' });
Multicodec.registerCodec({ code: 0x1302, name: 'x25519-priv' });
Multicodec.registerCodec({ code: 0xe7, name: 'secp256k1-pub' });
Multicodec.registerCodec({ code: 0x1301, name: 'secp256k1-priv' });
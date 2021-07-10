/* tslint:disable */
/* eslint-disable */
/*
 * Autogenerated by @creditkarma/thrift-typescript v3.7.2
 * DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
 */
import * as thrift from 'thrift';
export interface IKeyValueArgs {
  key: string;
  value?: string;
}
export class KeyValue {
  public key: string;
  public value?: string;
  constructor(args: IKeyValueArgs) {
    if (args != null && args.key != null) {
      this.key = args.key;
    } else {
      throw new thrift.Thrift.TProtocolException(
        thrift.Thrift.TProtocolExceptionType.UNKNOWN,
        'Required field[key] is unset!'
      );
    }
    if (args != null && args.value != null) {
      this.value = args.value;
    }
  }
  public write(output: thrift.TProtocol): void {
    output.writeStructBegin('KeyValue');
    if (this.key != null) {
      output.writeFieldBegin('key', thrift.Thrift.Type.STRING, 1);
      output.writeString(this.key);
      output.writeFieldEnd();
    }
    if (this.value != null) {
      output.writeFieldBegin('value', thrift.Thrift.Type.STRING, 2);
      output.writeString(this.value);
      output.writeFieldEnd();
    }
    output.writeFieldStop();
    output.writeStructEnd();
    return;
  }
  public static read(input: thrift.TProtocol): KeyValue {
    input.readStructBegin();
    let _args: any = {};
    while (true) {
      const ret: thrift.TField = input.readFieldBegin();
      const fieldType: thrift.Thrift.Type = ret.ftype;
      const fieldId: number = ret.fid;
      if (fieldType === thrift.Thrift.Type.STOP) {
        break;
      }
      switch (fieldId) {
        case 1:
          if (fieldType === thrift.Thrift.Type.STRING) {
            const value_1: string = input.readString();
            _args.key = value_1;
          } else {
            input.skip(fieldType);
          }
          break;
        case 2:
          if (fieldType === thrift.Thrift.Type.STRING) {
            const value_2: string = input.readString();
            _args.value = value_2;
          } else {
            input.skip(fieldType);
          }
          break;
        default: {
          input.skip(fieldType);
        }
      }
      input.readFieldEnd();
    }
    input.readStructEnd();
    if (_args.key !== undefined) {
      return new KeyValue(_args);
    } else {
      throw new thrift.Thrift.TProtocolException(
        thrift.Thrift.TProtocolExceptionType.UNKNOWN,
        'Unable to read KeyValue from input'
      );
    }
  }
}

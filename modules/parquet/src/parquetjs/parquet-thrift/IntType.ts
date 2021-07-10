/* tslint:disable */
/* eslint-disable */
/*
 * Autogenerated by @creditkarma/thrift-typescript v3.7.2
 * DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
 */
import * as thrift from 'thrift';
export interface IIntTypeArgs {
  bitWidth: number;
  isSigned: boolean;
}
export class IntType {
  public bitWidth: number;
  public isSigned: boolean;
  constructor(args: IIntTypeArgs) {
    if (args != null && args.bitWidth != null) {
      this.bitWidth = args.bitWidth;
    } else {
      throw new thrift.Thrift.TProtocolException(
        thrift.Thrift.TProtocolExceptionType.UNKNOWN,
        'Required field[bitWidth] is unset!'
      );
    }
    if (args != null && args.isSigned != null) {
      this.isSigned = args.isSigned;
    } else {
      throw new thrift.Thrift.TProtocolException(
        thrift.Thrift.TProtocolExceptionType.UNKNOWN,
        'Required field[isSigned] is unset!'
      );
    }
  }
  public write(output: thrift.TProtocol): void {
    output.writeStructBegin('IntType');
    if (this.bitWidth != null) {
      output.writeFieldBegin('bitWidth', thrift.Thrift.Type.BYTE, 1);
      output.writeByte(this.bitWidth);
      output.writeFieldEnd();
    }
    if (this.isSigned != null) {
      output.writeFieldBegin('isSigned', thrift.Thrift.Type.BOOL, 2);
      output.writeBool(this.isSigned);
      output.writeFieldEnd();
    }
    output.writeFieldStop();
    output.writeStructEnd();
    return;
  }
  public static read(input: thrift.TProtocol): IntType {
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
          if (fieldType === thrift.Thrift.Type.BYTE) {
            const value_1: number = input.readByte();
            _args.bitWidth = value_1;
          } else {
            input.skip(fieldType);
          }
          break;
        case 2:
          if (fieldType === thrift.Thrift.Type.BOOL) {
            const value_2: boolean = input.readBool();
            _args.isSigned = value_2;
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
    if (_args.bitWidth !== undefined && _args.isSigned !== undefined) {
      return new IntType(_args);
    } else {
      throw new thrift.Thrift.TProtocolException(
        thrift.Thrift.TProtocolExceptionType.UNKNOWN,
        'Unable to read IntType from input'
      );
    }
  }
}

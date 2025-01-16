export const PEER_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  debug: 3,
};

export const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
export const STAKE_AMOUNT_REGEX = /^\d*\.?\d*$/;
export const PEER_ID_REGEX = /^[a-zA-Z0-9-_]+$/;

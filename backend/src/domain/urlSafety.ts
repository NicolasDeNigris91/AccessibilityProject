import ipaddr from "ipaddr.js";

// Block anything that is not a public unicast address. Unparseable input is
// treated as blocked.
export function isBlockedIp(ipString: string): boolean {
  let addr: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    addr = ipaddr.parse(ipString);
  } catch {
    return true;
  }

  if (addr.kind() === "ipv6" && (addr as ipaddr.IPv6).isIPv4MappedAddress()) {
    addr = (addr as ipaddr.IPv6).toIPv4Address();
  }

  return addr.range() !== "unicast";
}

export function isLiteralIp(host: string): boolean {
  return ipaddr.isValid(host);
}

"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { encodeAbiParameters, parseUnits, type Abi, formatUnits } from "viem";
import { erc20Abi } from "viem";
import {
  Transaction,
  TransactionButton,
  TransactionStatus,
} from "@coinbase/onchainkit/transaction";
import unlockAbiJson from "../../lib/abis/Unlock.json";

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  icon?: ReactNode;
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled = false,
  type = "button",
  icon,
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0052FF] disabled:opacity-50 disabled:pointer-events-none";

  const variantClasses = {
    primary:
      "bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] text-[var(--app-background)]",
    secondary:
      "bg-[var(--app-gray)] hover:bg-[var(--app-gray-dark)] text-[var(--app-foreground)]",
    outline:
      "border border-[var(--app-accent)] hover:bg-[var(--app-accent-light)] text-[var(--app-accent)]",
    ghost:
      "hover:bg-[var(--app-accent-light)] text-[var(--app-foreground-muted)]",
  };

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 rounded-md",
    md: "text-sm px-4 py-2 rounded-lg",
    lg: "text-base px-6 py-3 rounded-lg",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="flex items-center mr-2">{icon}</span>}
      {children}
    </button>
  );
}

type CardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

export function Card({ title, children, className = "", onClick }: CardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`bg-[var(--app-card-bg)] backdrop-blur-md rounded-xl shadow-lg border border-[var(--app-card-border)] overflow-hidden transition-all hover:shadow-xl ${className} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
    >
      {title && (
        <div className="px-5 py-3 border-b border-[var(--app-card-border)]">
          <h3 className="text-lg font-medium text-[var(--app-foreground)]">
            {title}
          </h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

type FeaturesProps = {
  setActiveTab: (tab: string) => void;
};

export function Features({ setActiveTab }: FeaturesProps) {
  const [activeTier, setActiveTier] = useState(0);
  const tiers = [
    {
      name: "Creator",
      icon: "star" as const,
      features: [
        "Access to exclusive creative workshops and masterclasses",
        "Portfolio showcase and networking opportunities",
        "Monthly creative challenges and competitions",
        "Direct mentorship from industry professionals",
        "Early access to new tools and resources",
        "Community feedback and collaboration spaces",
        "Revenue sharing opportunities on platform projects",
      ],
    },
    {
      name: "Investor",
      icon: "star" as const,
      features: [
        "Exclusive access to emerging creative talent",
        "Priority investment opportunities in creative projects",
        "Detailed market analysis and trend reports",
        "Direct connections with top-tier creators",
        "Portfolio diversification strategies",
        "Exclusive investor-only events and networking",
        "Advanced analytics and performance tracking",
      ],
    },
    {
      name: "Brand",
      icon: "star" as const,
      features: [
        "Curated creator partnerships and collaborations",
        "Custom brand integration and storytelling campaigns",
        "Access to premium creative talent pool",
        "Strategic marketing consultation and campaign planning",
        "Exclusive brand showcase and visibility opportunities",
        "Priority access to trending creators and influencers",
        "Comprehensive brand analytics and ROI tracking",
      ],
    },
  ];

  const nextTier = () => {
    setActiveTier((prev) => (prev + 1) % tiers.length);
  };

  const prevTier = () => {
    setActiveTier((prev) => (prev - 1 + tiers.length) % tiers.length);
  };

  const goToTier = (index: number) => {
    setActiveTier(index);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Membership Tiers & Features">
        <div className="space-y-6">
          {/* Tier Cards Container */}
          <div className="relative">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${activeTier * 100}%)` }}
              >
                {tiers.map((tier, index) => (
                  <div key={tier.name} className="w-full flex-shrink-0">
                    <div className="bg-gradient-to-br from-[var(--app-card-bg)] to-[var(--app-card-border)] rounded-xl p-6 border border-[var(--app-card-border)]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-[var(--app-accent)] flex items-center">
                          <Icon name={tier.icon} className="mr-2" />
                          {tier.name} Tier
                        </h3>
                        <span className="text-sm text-[var(--app-foreground-muted)]">
                          {index + 1} of {tiers.length}
                        </span>
                      </div>

                      <ul className="space-y-3">
                        {tier.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start">
                            <Icon
                              name="check"
                              className="text-[var(--app-accent)] mt-1 mr-3 flex-shrink-0"
                            />
                            <span className="text-[var(--app-foreground-muted)] text-sm">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevTier}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-[var(--app-card-bg)] hover:bg-[var(--app-accent-light)] p-2 rounded-full shadow-lg border border-[var(--app-card-border)] transition-colors"
              aria-label="Previous tier"
            >
              <svg
                className="w-4 h-4 text-[var(--app-foreground)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={nextTier}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--app-card-bg)] hover:bg-[var(--app-accent-light)] p-2 rounded-full shadow-lg border border-[var(--app-card-border)] transition-colors"
              aria-label="Next tier"
            >
              <svg
                className="w-4 h-4 text-[var(--app-foreground)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2">
            {tiers.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTier(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === activeTier
                    ? "bg-[var(--app-accent)]"
                    : "bg-[var(--app-foreground-muted)] hover:bg-[var(--app-foreground)]"
                }`}
                aria-label={`Go to ${tiers[index].name} tier`}
              />
            ))}
          </div>

          {/* Swipe Instructions */}
          <div className="text-center">
            <p className="text-xs text-[var(--app-foreground-muted)]">
              Swipe or use arrows to explore different tiers
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setActiveTab("home")}
          className="mt-4"
        >
          Back to Home
        </Button>
      </Card>
    </div>
  );
}

type HomeProps = {
  setActiveTab: (tab: string) => void;
};

export function Home({ setActiveTab }: HomeProps) {
  const [selected, setSelected] = useState<(typeof MEMBERSHIPS)[0] | null>(
    null,
  );
  const [email, setEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [checking, setChecking] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<bigint>(0n);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Fetch USDC balance when modal opens or selected membership changes
  useEffect(() => {
    async function fetchUSDCBalance() {
      if (!address || !publicClient) return;
      setBalanceLoading(true);
      try {
        const balance = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        });
        setUsdcBalance(BigInt(balance));
      } catch {
        setUsdcBalance(0n);
      }
      setBalanceLoading(false);
    }
    if (showModal && selected && address && publicClient) {
      fetchUSDCBalance();
    }
  }, [showModal, selected, address, publicClient]);

  async function checkAllowance(membership: (typeof MEMBERSHIPS)[0]) {
    if (!address || !membership || !publicClient) return;
    setChecking(true);
    try {
      const allowance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, membership.address],
      });
      setIsApproved(
        BigInt(allowance) >= parseUnits(membership.price, membership.decimals),
      );
    } catch {
      setIsApproved(false);
    }
    setChecking(false);
  }

  async function approveUSDC(membership: (typeof MEMBERSHIPS)[0]) {
    if (!walletClient || !membership) return;
    // Check if the current network is Base (8453)
    const baseChainIdHex = "0x2105"; // 8453 in hex
    if (walletClient.chain?.id !== 8453) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: baseChainIdHex }],
        });
      } catch (switchError: unknown) {
        // Check if the error is an object and has a 'code' property
        if (
          typeof switchError === "object" &&
          switchError !== null &&
          "code" in switchError &&
          (switchError as { code: number }).code === 4902
        ) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: baseChainIdHex,
                  chainName: "Base Mainnet",
                  rpcUrls: ["https://mainnet.base.org"],
                  nativeCurrency: {
                    name: "Ether",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://basescan.org"],
                },
              ],
            });
          } catch {
            alert("Please add the Base network to your wallet to continue.");
            return;
          }
        } else {
          alert(
            "Please switch to the Base network in your wallet to continue.",
          );
          return;
        }
      }
      // After switching, the user must re-try the transaction
      return;
    }
    await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [
        membership.address,
        parseUnits(membership.price, membership.decimals),
      ],
    });
    await checkAllowance(membership);
  }

  function handleCardClick(membership: (typeof MEMBERSHIPS)[0]) {
    // Prevent selection if wallet is not connected
    if (!address) {
      return;
    }
    setSelected(membership);
    setShowModal(true);
    setEmail("");
    setIsApproved(false);
    checkAllowance(membership);
  }

  function closeModal() {
    setShowModal(false);
    setSelected(null);
    setEmail("");
    setIsApproved(false);
  }

  // Helper to check if user has enough USDC for selected membership
  const hasEnoughUSDC = selected
    ? usdcBalance >= parseUnits(selected.price, selected.decimals)
    : true;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Creative Memberships">
        <p className="text-[var(--app-foreground-muted)] mb-4">
          A membership for creative professionals at every level.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => setActiveTab("features")}
            icon={<Icon name="arrow-right" size="sm" />}
          >
            Explore Features
          </Button>
          <Button
            onClick={() => setActiveTab("fund")}
            variant="outline"
            icon={<Icon name="plus" size="sm" />}
          >
            Add Funds
          </Button>
        </div>
      </Card>

      <Card title="Choose Your Membership">
        <p className="text-[var(--app-foreground-muted)] mb-4">
          {!address
            ? "Connect your wallet to select a membership:"
            : "Select your tier to get started:"}
        </p>
        <div className="grid grid-cols-1 gap-4">
          {MEMBERSHIPS.map((m) => (
            <div
              key={m.name}
              className={`rounded-xl shadow-md border border-[var(--app-card-border)] bg-gradient-to-r ${m.color} p-4 flex items-center justify-between transition-transform ${
                address
                  ? "hover:scale-[1.02] cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={(e) => {
                if (address && !(e.target as HTMLElement).closest("button")) {
                  handleCardClick(m);
                }
              }}
            >
              <div className="flex items-center space-x-3">
                <Icon name="star" size="md" className="text-white" />
                <div>
                  <h3 className="text-lg font-bold text-white">{m.name}</h3>
                  <p className="text-white/80 text-sm">{m.price} USDC</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/90 text-xs mb-1">{m.description}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  onClick={() => handleCardClick(m)}
                  disabled={!address}
                >
                  {address ? "Purchase" : "Connect Wallet"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <MyMemberships />

      {/* Modal */}
      {showModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-[var(--app-card-bg)] rounded-xl shadow-xl p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-gray-600"
              onClick={closeModal}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-2">
              Buy {selected.name} Membership
            </h2>
            <p className="mb-4 text-[var(--app-foreground-muted)]">
              {selected.description}
            </p>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-[#1A202C]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 border rounded-lg text-[var(--app-foreground)] bg-[var(--app-card-bg)] border-[var(--app-card-border)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
              />
            </div>
            {/* USDC Balance Warning */}
            {selected && (
              <div className="mb-2 text-sm">
                {balanceLoading ? (
                  <span className="text-[var(--app-foreground-muted)]">
                    Checking USDC balance...
                  </span>
                ) : (
                  <span>
                    Your USDC balance:{" "}
                    {formatUnits(usdcBalance, selected.decimals)} USDC
                  </span>
                )}
                {!hasEnoughUSDC && !balanceLoading && (
                  <div className="text-red-500 mt-1">
                    Insufficient USDC balance for this membership.
                  </div>
                )}
              </div>
            )}
            {!isApproved ? (
              <Button
                variant="primary"
                size="md"
                className="w-full mb-2"
                onClick={() => approveUSDC(selected)}
                disabled={checking || !email || !hasEnoughUSDC}
              >
                {checking ? "Checking..." : `Approve ${selected.price} USDC`}
              </Button>
            ) : (
              <Transaction
                calls={[
                  {
                    address: selected.address,
                    abi: unlockAbiJson.abi as Abi,
                    functionName: "purchase",
                    args: [
                      [0], // values (for ERC20, always 0)
                      [address], // recipients
                      [ZERO_ADDRESS], // referrers
                      [address], // keyManagers
                      [
                        encodeAbiParameters(
                          [{ type: "string", name: "email" }],
                          [email],
                        ),
                      ], // data
                    ],
                  },
                ]}
              >
                <TransactionButton disabled={!hasEnoughUSDC} />
                <TransactionStatus />
              </Transaction>
            )}
            <Button
              variant="outline"
              size="md"
              className="w-full mt-2"
              onClick={closeModal}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

type IconProps = {
  name: "heart" | "star" | "check" | "plus" | "arrow-right";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function Icon({ name, size = "md", className = "" }: IconProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const icons = {
    heart: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Heart</title>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    star: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Star</title>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    check: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Check</title>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    plus: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Plus</title>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    "arrow-right": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Arrow Right</title>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    ),
  };

  return (
    <span className={`inline-block ${sizeClasses[size]} ${className}`}>
      {icons[name]}
    </span>
  );
}

function MyMemberships() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [memberships, setMemberships] = useState<
    Array<{
      name: string;
      hasAccess: boolean;
      keyId?: string;
      expirationTime?: bigint;
      color: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);

  const checkMemberships = useCallback(async () => {
    if (!address || !publicClient) return;

    setLoading(true);
    try {
      const membershipChecks = await Promise.all(
        MEMBERSHIPS.map(async (membership) => {
          try {
            // Check if user has a valid key for this membership
            const hasAccess = await publicClient.readContract({
              address: membership.address,
              abi: unlockAbiJson.abi as Abi,
              functionName: "getHasValidKey",
              args: [address],
            });

            let keyId, expirationTime;
            if (hasAccess) {
              try {
                // Get key details if user has access
                keyId = await publicClient.readContract({
                  address: membership.address,
                  abi: unlockAbiJson.abi as Abi,
                  functionName: "getTokenIdFor",
                  args: [address],
                });

                expirationTime = (await publicClient.readContract({
                  address: membership.address,
                  abi: unlockAbiJson.abi as Abi,
                  functionName: "keyExpirationTimestampFor",
                  args: [address],
                })) as bigint;
              } catch (error) {
                console.log("Could not fetch key details:", error);
              }
            }

            return {
              name: membership.name,
              hasAccess: Boolean(hasAccess),
              keyId: keyId?.toString(),
              expirationTime: expirationTime as bigint | undefined,
              color: membership.color,
            };
          } catch (error) {
            console.error(
              `Error checking ${membership.name} membership:`,
              error,
            );
            return {
              name: membership.name,
              hasAccess: false,
              color: membership.color,
            };
          }
        }),
      );

      setMemberships(membershipChecks);
    } catch (error) {
      console.error("Error checking memberships:", error);
    } finally {
      setLoading(false);
    }
  }, [address, publicClient]);

  // Check memberships when component mounts and when address changes
  useEffect(() => {
    if (address) {
      checkMemberships();
    }
  }, [address, checkMemberships]);

  const activeMemberships = memberships.filter((m) => m.hasAccess);
  const inactiveMemberships = memberships.filter((m) => !m.hasAccess);

  const formatExpirationDate = (timestamp?: bigint) => {
    if (!timestamp) return "Unknown";
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  return (
    <Card title="My Memberships">
      <div className="space-y-4">
        {!address ? (
          <p className="text-[var(--app-foreground-muted)] text-center py-4">
            Connect your wallet to view your memberships
          </p>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--app-accent)]"></div>
            <span className="ml-2 text-[var(--app-foreground-muted)]">
              Checking memberships...
            </span>
          </div>
        ) : (
          <>
            {activeMemberships.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-[var(--app-foreground)] mb-3 flex items-center">
                  <Icon
                    name="check"
                    size="sm"
                    className="text-green-500 mr-2"
                  />
                  Active Memberships
                </h4>
                <div className="space-y-2">
                  {activeMemberships.map((membership) => (
                    <div
                      key={membership.name}
                      className={`rounded-lg border border-[var(--app-card-border)] bg-gradient-to-r ${membership.color} p-3 flex items-center justify-between`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon name="star" size="sm" className="text-white" />
                        <div>
                          <h5 className="font-medium text-white">
                            {membership.name} Member
                          </h5>
                          {membership.keyId && (
                            <p className="text-white/80 text-xs">
                              Key #{membership.keyId}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-xs">
                          Expires:{" "}
                          {formatExpirationDate(membership.expirationTime)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inactiveMemberships.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-[var(--app-foreground-muted)] mb-3 flex items-center">
                  <Icon
                    name="plus"
                    size="sm"
                    className="text-[var(--app-foreground-muted)] mr-2"
                  />
                  Available Memberships
                </h4>
                <div className="space-y-2">
                  {inactiveMemberships.map((membership) => (
                    <div
                      key={membership.name}
                      className="rounded-lg border border-[var(--app-card-border)] bg-[var(--app-card-bg)] p-3 flex items-center justify-between opacity-60"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon
                          name="star"
                          size="sm"
                          className="text-[var(--app-foreground-muted)]"
                        />
                        <div>
                          <h5 className="font-medium text-[var(--app-foreground-muted)]">
                            {membership.name} Member
                          </h5>
                          <p className="text-[var(--app-foreground-muted)] text-xs">
                            Not owned
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {memberships.length === 0 && (
              <p className="text-[var(--app-foreground-muted)] text-center py-4">
                No membership data available
              </p>
            )}

            <div className="pt-3 border-t border-[var(--app-card-border)]">
              <Button
                variant="outline"
                size="sm"
                onClick={checkMemberships}
                disabled={loading}
                className="w-full"
                icon={<Icon name="arrow-right" size="sm" />}
              >
                {loading ? "Refreshing..." : "Refresh Memberships"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

// Keep the existing membership functionality as a separate component
const USDC_ADDRESS =
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" as `0x${string}`;
const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as `0x${string}`;
const MEMBERSHIPS = [
  {
    name: "Brand",
    address: "0x9c3744c96200a52d05a630d4aec0db707d7509be" as `0x${string}`,
    price: "1000",
    decimals: 6,
    description: "Curated creator partnerships and collaborations for brands.",
    color: "from-[#fbbf24] to-[#f59e42]",
  },
  {
    name: "Investor",
    address: "0x13b818daf7016b302383737ba60c3a39fef231cf" as `0x${string}`,
    price: "100",
    decimals: 6,
    description: "Exclusive access to creative investment opportunities.",
    color: "from-[#60a5fa] to-[#2563eb]",
  },
  {
    name: "Creator",
    address: "0xf7c4cd399395d80f9d61fde833849106775269c6" as `0x${string}`,
    price: "30",
    decimals: 6,
    description: "Unlock creative resources, mentorship, and community.",
    color: "from-[#34d399] to-[#059669]",
  },
];

export type ExpectedAction =
  | "give"
  | "place"
  | "wait"
  | "pie_choice"
  | "finished"
  | "join"
  | "none";

export type PlaySurfaceInput = {
  status: string;
  phase: string;
  turnSeat: 0 | 1 | null;
  pieceInHand: string | null;
  seat0: { telegramUserId: string } | null;
  seat1: { telegramUserId: string } | null;
  outcome: { type: string; winnerSeat?: number } | null;
  pieRule?: boolean;
  viewerTelegramUserId: string;
};

export type PlaySurfaceState = {
  sessionStatus: string;
  viewerSeat: 0 | 1 | null;
  expectedAction: ExpectedAction;
  isMyTurn: boolean;
  pieceInHandId: string | null;
  headlineKey: string;
  primaryCta: { key: string; enabled: boolean; intentHint?: string } | null;
  showGiveControls: boolean;
  showPlaceControls: boolean;
  showPieControls: boolean;
  showDeclareControls: boolean;
  handEmphasis: boolean;
};

function seatOf(input: PlaySurfaceInput): 0 | 1 | null {
  const id = input.viewerTelegramUserId;
  if (!id) return null;
  if (input.seat0?.telegramUserId === id) return 0;
  if (input.seat1?.telegramUserId === id) return 1;
  return null;
}

export function derivePlaySurfaceState(input: PlaySurfaceInput): PlaySurfaceState {
  const viewerSeat = seatOf(input);
  const base = {
    sessionStatus: input.status,
    viewerSeat,
    pieceInHandId: input.pieceInHand,
    showGiveControls: false,
    showPlaceControls: false,
    showPieControls: false,
    showDeclareControls: false,
    handEmphasis: false,
    isMyTurn: false,
    primaryCta: null as PlaySurfaceState["primaryCta"],
  };

  if (input.status === "finished" || input.outcome) {
    return {
      ...base,
      expectedAction: "finished",
      headlineKey: "promptFinished",
      primaryCta: { key: "offerRematch", enabled: true, intentHint: "rematch" },
    };
  }

  if (input.status === "waiting") {
    if (viewerSeat === 0 && !input.seat1) {
      return {
        ...base,
        expectedAction: "wait",
        headlineKey: "waitingOpponent",
        primaryCta: { key: "shareSession", enabled: true },
      };
    }
    if (viewerSeat == null) {
      return {
        ...base,
        expectedAction: "join",
        headlineKey: "promptJoin",
        primaryCta: { key: "joinSeat1", enabled: true, intentHint: "join" },
      };
    }
    return {
      ...base,
      expectedAction: "wait",
      headlineKey: "waitingOpponent",
    };
  }

  if (input.phase === "pie_choice") {
    const chooser = input.turnSeat;
    const mine = viewerSeat != null && chooser === viewerSeat;
    if (mine) {
      return {
        ...base,
        expectedAction: "pie_choice",
        isMyTurn: true,
        showPieControls: true,
        headlineKey: "promptPieChoice",
        primaryCta: { key: "pieTake", enabled: true, intentHint: "pie_choice" },
      };
    }
    return {
      ...base,
      expectedAction: "wait",
      headlineKey: "promptWait",
    };
  }

  const myTurn = viewerSeat != null && input.turnSeat === viewerSeat;

  if (input.phase === "select_give" && !input.pieceInHand) {
    if (myTurn) {
      return {
        ...base,
        expectedAction: "give",
        isMyTurn: true,
        showGiveControls: true,
        showDeclareControls: true,
        headlineKey: "promptGive",
        primaryCta: { key: "giveSelected", enabled: true, intentHint: "give" },
      };
    }
    return {
      ...base,
      expectedAction: "wait",
      showDeclareControls: viewerSeat != null,
      headlineKey: "promptWait",
    };
  }

  if (input.phase === "place_received" && input.pieceInHand) {
    if (myTurn) {
      return {
        ...base,
        expectedAction: "place",
        isMyTurn: true,
        showPlaceControls: true,
        showDeclareControls: true,
        handEmphasis: true,
        headlineKey: "promptPlace",
        primaryCta: { key: "promptPlaceCta", enabled: true, intentHint: "place" },
      };
    }
    return {
      ...base,
      expectedAction: "wait",
      showDeclareControls: viewerSeat != null,
      headlineKey: "promptWait",
    };
  }

  return {
    ...base,
    expectedAction: "none",
    showDeclareControls: viewerSeat != null && input.status === "active",
    headlineKey: "promptWait",
  };
}

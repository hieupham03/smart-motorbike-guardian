// UI acceptance with controlled REST/STOMP fixtures. No broker, physical board or real account.
const fs = require("fs");
const path = require("path");
const http = require("http");
const assert = require("assert/strict");
const { chromium } = require("../../frontend/node_modules/playwright");
const root = path.resolve(__dirname, "../..");
const output = path.join(root, "docs/evidence/user-dev-ui/2026-11-01");
const checks = [],
  pageErrors = [],
  apiRequests = [];
const servers = [];
let browser;
const now = () => new Date().toISOString();
const jwt = () =>
  "fixture." +
  Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
  ).toString("base64url") +
  ".fixture";

async function serve(directory, port) {
  const base = path.resolve(root, directory);
  assert.ok(
    fs.existsSync(path.join(base, "index.html")),
    `Build required: ${directory}`,
  );
  const server = http.createServer((req, res) => {
    let file = path.resolve(
      base,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (file !== base && !file.startsWith(base + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory())
      file = path.join(base, "index.html");
    res.writeHead(200, {
      "Content-Type":
        {
          ".html": "text/html",
          ".js": "application/javascript",
          ".css": "text/css",
          ".png": "image/png",
          ".svg": "image/svg+xml",
          ".ttf": "font/ttf",
          ".woff2": "font/woff2",
          ".json": "application/json",
        }[path.extname(file)] || "application/octet-stream",
    });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  servers.push(server);
  return `http://127.0.0.1:${port}`;
}

async function session(kind, origin, role = "OWNER") {
  const context = await browser.newContext({
    viewport:
      kind === "web"
        ? { width: 1440, height: 1000 }
        : { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(15000);
  page.on("pageerror", (err) => pageErrors.push(`${kind}: ${err.message}`));
  page.on("dialog", (dialog) => dialog.accept());
  await page.route("**/*", (route) =>
    ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort(),
  );
  const device = {
    deviceId: "ui-real",
    deviceUuid: "ui-controlled-hardware",
    name: "Xe thử nghiệm giao diện",
    licensePlate: "29-UI 001",
    vehicleModel: "Motor mô hình",
    dataSource: "HARDWARE",
    currentUserRole: role,
    lifecycleState: "ACTIVE",
    securityState: "PARKED",
    sensorConnected: true,
    speedValid: true,
    imuValid: true,
    gpsValid: false,
    gpsAgeMs: 4294967295,
    lastLatitude: null,
    lastLongitude: null,
    lastLocationReceivedAt: null,
    lastSpeedKmh: 0,
    lastBatteryV: null,
    firmwareVersion: "ui-fixture",
    hwVersion: "fixture",
    speedThresholdKmh: 80,
    batteryLowThresholdV: 11.5,
    tiltThresholdDeg: 50,
  };
  const simulated = {
    ...device,
    deviceId: "ui-simulated",
    deviceUuid: "ui-simulated-uuid",
    name: "Xe dùng dữ liệu mô phỏng",
    dataSource: "SIMULATED",
  };
  const user = {
    userId: "ui-" + role,
    email: role.toLowerCase() + "@example.invalid",
    fullName: "Người dùng thử giao diện",
    role,
    status: "ACTIVE",
  };
  let selected = device,
    commands = [],
    alerts = [],
    socket,
    subscription,
    sequence = 1,
    speed = 0;
  const stats = {
    deviceId: device.deviceId,
    sessionId: "12345678-1",
    sequence: 1,
    sourceBootId: 42,
    pulseCount: 10,
    revolutions: 10,
    distanceM: 2.0420352,
    maxSpeedKmh: 3,
    movingMs: 2000,
    elapsedMs: 5000,
    fresh: true,
    overspeedActive: false,
    speedLimitKmh: 2,
    circumferenceM: 0.20420352,
    pulsesPerRev: 1,
  };
  const view = (d) => ({
    ...d,
    lastTelemetryAt: now(),
    lastSeenAt: now(),
    lastSpeedKmh: speed,
  });
  const wheel = () => ({ ...stats, sequence: ++sequence, receivedAt: now() });
  const reading = () => ({
    readingId: "ui-reading",
    deviceId: device.deviceId,
    dataSource: "HARDWARE",
    sensorConnected: true,
    speedValid: true,
    imuValid: true,
    gpsValid: false,
    gpsAgeMs: 4294967295,
    deviceUptimeS: 120,
    speedKmh: speed,
    batteryV: null,
    accelX: 0.1,
    accelY: 0.2,
    accelZ: 9.81,
    latitude: null,
    longitude: null,
    state: device.securityState,
    ts: Math.floor(Date.now() / 1000),
    receivedAt: now(),
  });
  const emit = (type, data, id = device.deviceId) => {
    if (!socket || !subscription) return;
    socket.send(
      `MESSAGE\nsubscription:${subscription}\nmessage-id:${Date.now()}-${sequence++}\ncontent-type:application/json\n\n${JSON.stringify({ type, deviceId: id, data, sentAt: now() })}\0`,
    );
  };
  await page.routeWebSocket("**/ws", (ws) => {
    socket = ws;
    ws.onMessage((message) => {
      const frame = String(message);
      if (/^(CONNECT|STOMP)\n/.test(frame))
        ws.send("CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0");
      if (frame.startsWith("SUBSCRIBE\n"))
        subscription = frame.match(/\nid:([^\n]+)/)?.[1];
    });
  });
  await page.route("**/api/**", async (route) => {
    const req = route.request(),
      p = new URL(req.url()).pathname,
      method = req.method();
    let data,
      status = 200;
    const body =
      method === "POST" || method === "PATCH" ? req.postDataJSON() : null;
    apiRequests.push({
      kind,
      role,
      path: p,
      method,
      ...(p.endsWith("/command") ? { command: body?.type } : {}),
    });
    if (method === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Methods": "*",
        },
      });
      return;
    }
    if (p === "/api/auth/login" || p === "/api/auth/refresh")
      data = {
        accessToken: jwt(),
        refreshToken: "ui-fixture-refresh",
        expiresIn: 3600000,
        user,
      };
    else if (p === "/api/users/me") data = user;
    else if (p === "/api/devices") data = [view(device), view(simulated)];
    else if (p === "/api/alerts") data = alerts;
    else if (p.endsWith("/telemetry/latest")) data = reading();
    else if (p.endsWith("/telemetry")) data = [reading()];
    else if (p.endsWith("/wheel-session")) data = wheel();
    else if (p.endsWith("/commands")) data = commands;
    else if (p.endsWith("/users")) data = [user];
    else if (p.endsWith("/config")) {
      assert.ok(
        !("speedThresholdKmh" in body),
        "User metadata must not send simulation thresholds",
      );
      Object.assign(device, body);
      data = view(device);
    } else if (p.endsWith("/command")) {
      if (role === "VIEWER") {
        status = 403;
        data = null;
      } else {
        const c = {
          cmdId: "ui-command-" + sequence++,
          deviceId: device.deviceId,
          type: body.type,
          status: "PENDING",
          issuedAt: now(),
          reasonIfFailed: null,
        };
        commands.unshift(c);
        data = c;
      }
    } else if (p === "/api/simulator/action") {
      assert.equal(
        body.deviceId,
        simulated.deviceId,
        "Never simulate a HARDWARE source",
      );
      assert.notEqual(role, "VIEWER");
      data = null;
    } else if (p.startsWith("/api/devices/"))
      data = view(p.includes(simulated.deviceId) ? simulated : device);
    else throw Error(`Unexpected fixture request ${method} ${p}`);
    await route.fulfill({
      status,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: status === 200,
        data,
        message: status === 200 ? "OK" : "Không có quyền",
      }),
    });
  });
  if (kind === "web")
    await context.addInitScript(
      ({ user, token }) => {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("refreshToken", "ui-fixture-refresh");
        localStorage.setItem("currentUser", JSON.stringify(user));
      },
      { user, token: jwt() },
    );
  await page.goto(origin);
  if (kind === "mobile") {
    await page.getByLabel("Email", { exact: true }).fill(user.email);
    await page
      .getByLabel("Mật khẩu", { exact: true })
      .fill("local-fixture-password");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  }
  await page
    .getByText(
      kind === "web" ? "Theo dõi xe, an tâm hơn" : "An tâm hơn mỗi ngày",
      { exact: true },
    )
    .waitFor();
  for (let attempt = 0; !subscription && attempt < 100; attempt++)
    await page.waitForTimeout(50);
  assert.ok(
    subscription,
    "STOMP fixture must be connected before issuing commands",
  );
  async function shot(name) {
    await page.evaluate(() => {
      if (document.getElementById("evidence-label")) return;
      const banner = document.createElement("div");
      banner.id = "evidence-label";
      banner.textContent =
        "KIỂM THỬ GIAO DIỆN · DỮ LIỆU GIẢ LẬP · KHÔNG PHẢI MẠCH / ĐIỆN THOẠI THẬT";
      Object.assign(banner.style, {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: "#fef3c7",
        color: "#713f12",
        fontSize: "11px",
        padding: "6px",
        textAlign: "center",
      });
      document.body.append(banner);
    });
    await page.screenshot({
      path: path.join(output, name + ".png"),
      fullPage: true,
    });
  }
  async function fits(label) {
    const dims = await page.evaluate(() => ({
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    assert.ok(
      dims.document <= dims.viewport + 1,
      `${label}: horizontal overflow ${JSON.stringify(dims)}`,
    );
    checks.push(label + " fits viewport");
  }
  return {
    context,
    page,
    device,
    simulated,
    commands,
    alerts,
    emit,
    reading,
    view,
    wheel,
    shot,
    fits,
    origin,
    setSpeed: (value) => {
      speed = value;
    },
    selectSim: () => {
      selected = simulated;
      return selected;
    },
  };
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const web = await serve("frontend/dist", 15180),
    mobile = await serve("frontend/mobile/dist", 15181);
  browser = await chromium.launch({
    headless: true,
    executablePath:
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  });
  for (const kind of ["web", "mobile"]) {
    const s = await session(kind, kind === "web" ? web : mobile);
    const { page, device, commands, emit, view, shot, fits } = s;
    const body = () => page.locator("body").innerText();
    assert.ok(
      !/\b(?:PARKED|ARMED|HARDWARE|STALE|ACK|UART|MQTT|WebSocket)\b/.test(
        await body(),
      ),
      `${kind}: technical jargon leaked onto consumer dashboard`,
    );
    checks.push(
      `${kind}: consumer dashboard has plain language and no technical telemetry panel`,
    );
    await fits(kind + " dashboard");
    await shot(kind + "-dashboard");
    // The consumer map explains absent, fresh and old positions without raw GPS state codes.
    await page.goto(s.origin + "/map");
    await page
      .getByText(/Chưa xác định được vị trí/)
      .first()
      .waitFor();
    Object.assign(device, {
      lastLatitude: 21.0285,
      lastLongitude: 105.8544,
      lastLocationReceivedAt: now(),
      gpsValid: true,
      gpsAgeMs: 0,
    });
    emit("DEVICE", view(device));
    await page
      .getByText(/Vị trí mới cập nhật/)
      .first()
      .waitFor();
    device.gpsValid = false;
    emit("DEVICE", view(device));
    await page
      .getByText(/Vị trí cuối đã biết/)
      .first()
      .waitFor();
    assert.ok(!/\b(?:NO_FIX|STALE)\b/.test(await body()));
    checks.push(
      `${kind}: map distinguishes missing, fresh and last-known position in plain language`,
    );
    await page.goto(
      s.origin + (kind === "web" ? "/devices" : "/device/" + device.deviceId),
    );
    if (kind === "web")
      await page
        .getByRole("button", { name: "Sửa thông tin xe", exact: true })
        .first()
        .click();
    const name =
      kind === "web"
        ? page.getByLabel("Tên xe:", { exact: true })
        : page.getByLabel("Tên xe", { exact: true });
    await name.fill("Tên đang nhập chưa lưu");
    emit("DEVICE", view(device));
    await page.waitForTimeout(100);
    assert.equal(await name.inputValue(), "Tên đang nhập chưa lưu");
    const metadata = page.waitForRequest(
      (req) =>
        req.method() === "PATCH" &&
        new URL(req.url()).pathname.endsWith("/config"),
    );
    await page
      .getByRole("button", {
        name: kind === "web" ? "Lưu Thay Đổi" : "Lưu thông tin xe",
        exact: true,
      })
      .click();
    assert.ok(!("speedThresholdKmh" in (await metadata).postDataJSON()));
    checks.push(
      `${kind}: metadata editor preserves typing during realtime and sends no hidden simulation threshold`,
    );
    if (kind === "web") await page.goto(s.origin + "/");
    if (kind === "web") {
      await page
        .getByRole("button", { name: "Bật bảo vệ", exact: true })
        .click();
    } else {
      await page.goto(s.origin + "/control");
      await page
        .getByRole("button", { name: "Bật bảo vệ", exact: true })
        .click();
    }
    await page.getByText(/Bật bảo vệ: Đang chờ thiết bị/).waitFor();
    assert.ok(!(await body()).includes("Bật bảo vệ: Đã thực hiện"));
    commands[0] = {
      ...commands[0],
      status: "REJECTED",
      reasonIfFailed: "SPEED_NOT_ZERO",
    };
    emit("COMMAND", commands[0]);
    await page
      .getByText(/bánh xe đang quay hoặc chưa dừng đủ lâu/i)
      .first()
      .waitFor();
    checks.push(
      `${kind}: pending command does not claim success; rejection uses actionable user text`,
    );
    await page.goto(s.origin + "/developer");
    await page
      .getByText("Chẩn đoán & thử nghiệm", { exact: true })
      .first()
      .waitFor();
    await page.getByText("deviceUuid", { exact: true }).waitFor();
    assert.ok((await body()).includes("ui-controlled-hardware"));
    assert.equal(
      await page.getByText("TRIGGER_FALL", { exact: true }).count(),
      0,
    );
    checks.push(
      `${kind}: owner diagnostics preserve technical fields and hide simulator on hardware`,
    );
    await fits(kind + " developer");
    await shot(kind + "-developer");
    device.currentUserRole = "VIEWER";
    emit("DEVICE", view(device));
    await page.getByText(/Cần quyền chủ xe hoặc quản trị viên/).waitFor();
    assert.equal(
      await page.getByText("deviceUuid", { exact: true }).count(),
      0,
    );
    device.currentUserRole = "OWNER";
    emit("DEVICE", view(device));
    await page.getByText("deviceUuid", { exact: true }).waitFor();
    checks.push(
      `${kind}: live role downgrade removes developer data and role restoration reopens diagnostics`,
    );
    for (const route of kind === "web"
      ? ["/alerts", "/commands", "/analytics", "/devices", "/profile"]
      : ["/alerts", "/history", "/devices", "/profile"]) {
      await page.goto(s.origin + route);
      await page.waitForTimeout(150);
      await fits(kind + " " + route);
      assert.ok(
        !/\b(?:ACK|MQTT|UART|JWT|WebSocket|PARKED|HARDWARE|SIMULATED)\b/.test(
          await body(),
        ),
        `${kind}: jargon on ${route}`,
      );
    }
    if (kind === "web") {
      await page.goto(s.origin + "/");
      await page.setViewportSize({ width: 375, height: 812 });
      await fits("web small phone");
      await shot("web-small-phone");
      await page.setViewportSize({ width: 812, height: 375 });
      await fits("web landscape");
    } else {
      await page.goto(s.origin + "/devices");
      await page
        .getByText("Xe dùng dữ liệu mô phỏng", { exact: true })
        .waitFor();
      const card = page
        .getByText("Xe dùng dữ liệu mô phỏng", { exact: true })
        .locator("..");
      await card
        .getByRole("button", { name: "Xem tình trạng xe", exact: true })
        .click();
      await page.getByText(/Dữ liệu mô phỏng · Không dùng/).waitFor();
      checks.push(
        "mobile: simulated vehicle remains visibly labeled as simulated",
      );
      await page.goto(s.origin + "/developer");
      await page
        .getByRole("button", { name: "TRIGGER_FALL", exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "TRIGGER_FALL", exact: true })
        .click();
      await page.getByText(/Simulator: TRIGGER_FALL/).waitFor();
      checks.push(
        "mobile: simulator action targets only selected simulated vehicle",
      );
      await page.setViewportSize({ width: 375, height: 812 });
      await fits("mobile small phone developer");
      await page.goto(s.origin + "/");
      await fits("mobile small phone dashboard");
      await page.setViewportSize({ width: 812, height: 375 });
      await fits("mobile landscape dashboard");
    }
    await s.context.close();
    const viewer = await session(kind, kind === "web" ? web : mobile, "VIEWER");
    await viewer.page.goto(viewer.origin + "/developer");
    await viewer.page
      .getByText(/Cần quyền chủ xe hoặc quản trị viên/)
      .waitFor();
    assert.equal(
      await viewer.page.getByText("TRIGGER_FALL", { exact: true }).count(),
      0,
    );
    checks.push(
      `${kind}: Viewer direct navigation cannot open developer tools`,
    );
    await viewer.context.close();
  }
  assert.deepEqual(pageErrors, []);
  const report = {
    result: "PASS",
    source: "CONTROLLED_REST_STOMP_UI_FIXTURES",
    checks,
    pageErrors,
    physicalBoard: false,
    nativePhone: false,
    publicServicesContacted: false,
  };
  fs.writeFileSync(
    path.join(output, "ui-acceptance.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify({
      result: report.result,
      checks: checks.length,
      pageErrors: pageErrors.length,
    }),
  );
}
main()
  .catch((error) => {
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(
      path.join(output, "ui-failure.json"),
      JSON.stringify({ error: String(error), checks, pageErrors }, null, 2),
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    await Promise.all(
      servers.map((s) => new Promise((resolve) => s.close(resolve))),
    );
  });

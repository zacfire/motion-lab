// INPUT: isAlive（登录有效=跳；否则停）+ Reduce Motion
// OUTPUT: 设置页脚彩蛋级点阵红心（Akureyri 涟漪算法）
// POS: 「芦苇还活着」生命体征，不是 Thinking / Orb 状态点
// ⚠️ 一旦我被更新，务必更新开头注释及所属文件夹的 CLAUDE.md

import SwiftUI

/// 设置页脚点阵红心跳。
///
/// 算法对齐 lovethinking `RippleHeartAnimation`：27 点心形格点 + 距中心归一化相位涟漪。
/// 仅用于「还活着」彩蛋；不进 Orb、不进聊天状态栏。
struct RoseauHeartbeatView: View {
    var isAlive: Bool = true
    /// 显示宽度（逻辑格点 20×17，高度按比例）
    var displayWidth: CGFloat = 28
    var durationSeconds: TimeInterval = 1.2

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var displayHeight: CGFloat {
        displayWidth * HeartLattice.logicalHeight / HeartLattice.logicalWidth
    }

    var body: some View {
        Group {
            if isAlive && !reduceMotion {
                TimelineView(.animation(minimumInterval: 1.0 / 30.0, paused: false)) { context in
                    heartbeatCanvas(date: context.date)
                }
            } else {
                heartbeatCanvas(date: nil)
            }
        }
        .frame(width: displayWidth, height: displayHeight)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(accessibilityLabelText)
    }

    private var accessibilityLabelText: String {
        if isAlive {
            String(localized: "芦苇还活着", comment: "Settings footer heartbeat: alive")
        } else {
            String(localized: "芦苇暂时没连上", comment: "Settings footer heartbeat: not alive")
        }
    }

    @ViewBuilder
    private func heartbeatCanvas(date: Date?) -> some View {
        Canvas { context, size in
            let scaleX = size.width / HeartLattice.logicalWidth
            let scaleY = size.height / HeartLattice.logicalHeight
            let progress: CGFloat
            if let date, isAlive, !reduceMotion {
                let elapsed = date.timeIntervalSinceReferenceDate
                progress = CGFloat(elapsed.truncatingRemainder(dividingBy: durationSeconds) / durationSeconds)
            } else {
                progress = 0.35
            }

            for dot in HeartLattice.dots {
                let phase = HeartLattice.phase(progress: progress, normalizedDistance: dot.normalizedDistance)
                let (radiusFactor, alpha): (CGFloat, CGFloat)
                if isAlive && !reduceMotion {
                    (radiusFactor, alpha) = HeartLattice.radiusAndAlpha(phase: phase)
                } else if isAlive {
                    (radiusFactor, alpha) = (0.85, 0.85)
                } else {
                    (radiusFactor, alpha) = (0.7, 0.28)
                }

                let radius = 0.5 * radiusFactor * min(scaleX, scaleY)
                let center = CGPoint(x: dot.x * scaleX, y: dot.y * scaleY)
                var circle = Path()
                circle.addEllipse(in: CGRect(
                    x: center.x - radius,
                    y: center.y - radius,
                    width: radius * 2,
                    height: radius * 2
                ))
                context.fill(
                    circle,
                    with: .color(HeartbeatPalette.pulseRed.opacity(Double(alpha)))
                )
            }
        }
    }
}

// MARK: - Lattice (faithful to RippleHeartAnimation)

private enum HeartLattice {
    static let logicalWidth: CGFloat = 20
    static let logicalHeight: CGFloat = 17
    private static let center = CGPoint(x: 10, y: 8.5)

    struct Dot: Sendable {
        let x: CGFloat
        let y: CGFloat
        let normalizedDistance: CGFloat
    }

    static let dots: [Dot] = {
        let raw: [(CGFloat, CGFloat)] = [
            (10.25, 15),
            (7.25, 12), (10.25, 12), (13.25, 12),
            (4.25, 9), (7.25, 9), (10.25, 9), (13.25, 9), (16.25, 9),
            (1.25, 6), (4.25, 6), (7.25, 6), (10.25, 6), (13.25, 6), (16.25, 6), (19.25, 6),
            (1.25, 3), (4.25, 3), (7.25, 3), (10.25, 3), (13.25, 3), (16.25, 3), (19.25, 3),
            (4.25, 0), (7.25, 0), (13.25, 0), (16.25, 0),
        ]
        let withDistance = raw.map { point -> (CGFloat, CGFloat, CGFloat) in
            let dx = point.0 - center.x
            let dy = point.1 - center.y
            return (point.0, point.1, hypot(dx, dy))
        }
        let maxDistance = withDistance.map(\.2).max() ?? 1
        return withDistance.map { Dot(x: $0.0, y: $0.1, normalizedDistance: $0.2 / maxDistance) }
    }()

    static func phase(progress: CGFloat, normalizedDistance: CGFloat) -> CGFloat {
        var value = (progress - 0.5 * normalizedDistance + 1)
        value = value.truncatingRemainder(dividingBy: 1)
        if value < 0 { value += 1 }
        return value
    }

    static func radiusAndAlpha(phase: CGFloat) -> (CGFloat, CGFloat) {
        if phase < 0.5 {
            return (0.5 + 3 * phase, 2 * phase)
        }
        return (2 - (phase - 0.5) * 3, 1 - (phase - 0.5) * 2)
    }
}

/// 设置页脚心跳专用色；不进 DesignSystem（彩蛋签名色，非全局角色）。
private enum HeartbeatPalette {
    /// Akureyri 心形红绿灯红 `#FF3366`
    static let pulseRed = Color(red: 1.0, green: 0.2, blue: 0.4)
}

#if DEBUG
#Preview("Alive") {
    RoseauHeartbeatView(isAlive: true)
        .padding()
        .background(DesignSystem.Colors.background)
}

#Preview("Stopped") {
    RoseauHeartbeatView(isAlive: false)
        .padding()
        .background(DesignSystem.Colors.background)
}
#endif

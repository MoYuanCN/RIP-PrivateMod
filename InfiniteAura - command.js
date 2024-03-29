const LOCAL_PLAYER_ID = getLocalPlayerUniqueID(); //自身ID

let POS_Y_MAX = 83; //最高Y坐标
let MAX_RANGE = 500; //最远范围
let ATTACK_COUNT = 3; //攻击和点击次数
let AUTO_INTERVAL = 15; //自动传送间隔

let AutoMode = false; //自动手动切换，默认为手动
let Team = false; //智能队友开关，默认关闭
var autotp = false; //是否自动tp，默认为不
let backPos = null; //自动返回记录的坐标
let backMotion = null; //自动返回所记录的移动值
let target = null; //攻击目标唯一数字ID
let attackCount = 0; //剩余攻击次数
let mode = true; //控制传送模式，默认Pos
let tpHide = true; //控制传送信息显示，默认为true
let tick = 0;

const setPos = p => setEntityPos(LOCAL_PLAYER_ID, p.x, p.y, p.z);
const setMotion = m => setEntityMotion(LOCAL_PLAYER_ID, m.x, m.y, m.z);
const getPos = () => getEntityPos(LOCAL_PLAYER_ID);
const getMotion = () => getEntityMotion(LOCAL_PLAYER_ID);
const getRange = (f, t) => Math.hypot(f.x - t.x, f.y - t.y, f.z - t.z);
const click = p => buildBlock(LOCAL_PLAYER_ID, p.x, p.y, p.z, 0);
const COLLISION_X_MIN = 0.1; //最低X碰撞箱
const COLLISION_Y_MIN = 0.1; //最低Y碰撞箱

function attack() {
    const localPlayerPos = getPos(); //获取自身坐标,用于和其他玩家的坐标进行对比
    let minRange = MAX_RANGE; //最近一个玩家和自身的距离
    for (const id of getPlayerList()) {
        if (id === LOCAL_PLAYER_ID) continue; //遍历到自身则跳过
        const collision = getEntitySize(id);
        if (Team && collision.x < COLLISION_X_MIN && collision.y < COLLISION_Y_MIN) continue;
        const pos = getEntityPos(id);
        if (pos.y >= POS_Y_MAX) continue; //超过高度上限则跳过
        const range = getRange(localPlayerPos, pos);
        if (range < minRange) {
            minRange = range;
            target = id;
        }
    }
    if (target) { //如果寻找到目标
        attackCount = ATTACK_COUNT; //设置攻击次数
        backPos = localPlayerPos; //记录坐标
        backMotion = getMotion(); //记录移动值
        teleport(); //传送至目标
    } else clientMessage('§lRunAway >> §rInfiniteAuraRIP : §b没有合适的目标');
}

function teleport() { //计算偏移并且通过移动值传送到目标位置
    attackCount--;
    const pos = getEntityPos(target);
    if (mode) {
        setPos({
            x: pos.x,
            y: pos.y,
            z: pos.z
        });
    } else {
        setMotion({
            x: pos.x - backPos.x,
            y: pos.y - backPos.y,
            z: pos.z - backPos.z
        });
    }
}


function onPlayerAttackEvent(meid,target) {
    var health = getEntityAttribute(target,4)
    var current = health.current
    var max = health.max
    var item = getEntityCarriedItem(target)
    var damage = getEntityAttribute(target,5)
    var Attack=damage.current
    showTipMessage("§9[InfiniteAuraRIP] §7>>>"+"\n§f当前血量 §7>>>§c"+current+"§f/§4"+max+"\n§f当前物品 §7>>>§e"+item.name+"\n§f攻击伤害 §7>>>§d"+Attack)
        }

function onTickEvent() {
    if (autotp && AutoMode) {
        if (!tick--) {
            attack();
            tick = AUTO_INTERVAL;
        }
    } else tick = 0;
    if (backPos) {
        if (mode) {
            if (tpHide) {
                executeCommand("/ww tp " + backPos.x + " " + backPos.y + " " + backPos.z)
            };
            click(backPos);
            attackEntity(target, true);
        } else {
            setPos(backPos);
            click(backPos);
            attackEntity(target, true);
        }
    }
    if (target) {
        if (attackCount) {
            teleport();
        } else {
            if (mode) {
                backPos = backMotion = target = null;
            } else {
                setMotion(backMotion);
                backPos = backMotion = target = null;
            }
        }
    }
}

function onExecuteCommandEvent(command) {
    switch (command) {
        case '/InfiniteAura exit':
            clientMessage('§lRunAway > Exit InfiniteAuraRIP §c✘');
            while (attackCount--) back();
            exit();
            break;
        case '/TpState':
            tpHide = !tpHide;
            if (tpHide) {
                clientMessage('§l§d[InfiniteAuraRIP]§r§8>>>§r§e 传送信息显示 §a 已启用')
                } else
                clientMessage('§l§d[InfiniteAuraRIP]§r§8>>>§r§e 传送信息显示 §c 已禁用');
            break;
        case '/InfiniteAura Set_Y_MAX':
            let pos = getEntityPos(LOCAL_PLAYER_ID);
            let Y = Math.ceil(pos.y) - 1;
            POS_Y_MAX = Y;
            clientMessage('§lRunAway >> §rInfiniteAuraRIP : §b已将MAX_Y设置为' + Y);
            break;
        case '/InfiniteAura Team':
            Team = !Team;
            if (Team) clientMessage('§lRunAway >> §rInfiniteAuraRIP : §eTeam §b✔');
            else clientMessage('§lRunAway >> §rInfiniteAuraRIP : §eTeam §c✘');
            break;
        case '/InfiniteAura MOVEMode':
            mode = !mode;
            if (mode) clientMessage('§lRunAway >> §rInfiniteAuraRIP : Mode-§bPos');
            else clientMessage('§lRunAway >> §rInfiniteAuraRIP : Mode-§eMotion');
            break;
        case '/InfiniteAura AutoMode':
            AutoMode = !AutoMode;
            if (AutoMode) clientMessage('§lRunAway >> §rInfiniteAuraRIP : §eAutoTp §b✔');
            else clientMessage('§lRunAway >> §rInfiniteAuraRIP : §eAutoTp §c✘');
            break;
        case '/InfiniteAura Attack':
            if (AutoMode) {
                autotp = !autotp;
                if (autotp) clientMessage('§lRunAway >> §7InfiniteAuraRIP — Enabled §b✔');
                else clientMessage('§lRunAway >> §7InfiniteAuraRIP — Disabled §c✘');
            } else {
                if (!attackCount) attack();
                else clientMessage('§lRunAway >> §rInfiniteAuraRIP : §b操作过快');
            }
            break;
        default:
            if (/^\/Set (ATTACK_COUNT|MAX_RANGE|POS_Y_MAX|AUTO_INTERVAL)/.test(command)) {
                const regex = /^\/Set (ATTACK_COUNT|MAX_RANGE|POS_Y_MAX|AUTO_INTERVAL) (\d+)$/;
                const match = command.match(regex);
                if (match) {
                    const option = match[1];
                    const value = parseInt(match[2]);
                    if (option === "ATTACK_COUNT") {
                        ATTACK_COUNT = value;
                        clientMessage('§lRunAway >> §rInfiniteAuraRIP : §b已将ATTACK_COUNT设置为' + value);
                    }
                    if (option === "MAX_RANGE") {
                        MAX_RANGE = value;
                        clientMessage('§lRunAway >> §rInfiniteAuraRIP : §b已将MAX_RANGE设置为' + value);
                    }
                    if (option === "POS_Y_MAX") {
                        POS_Y_MAX = value;
                        clientMessage('§lRunAway >> §rInfiniteAuraRIP : §b已将POS_Y_MAX设置为' + value);
                    }
                    if (option === "AUTO_INTERVAL") {
                        AUTO_INTERVAL = value;
                        clientMessage('§lRunAway >> §rInfiniteAuraRIP : §b已将AUTO_INTERVAL设置为' + value);
                    }
                }
                return true;
            }
            return;
    }
    return true;
}

// 配置界面
function InfiniteAuraSetting() {
    const custom_form = `
    {
    "type": "custom_form",
    "title": "配置界面",
    "content": [
      {
        "type": "input",
        "text": "攻击次数",
        "placeholder": "默认为3"
      },
      {
        "type": "input",
        "text": "最大攻击距离",
        "placeholder": "默认为500"
      },
      {
        "type": "input",
        "text": "自动攻击间隔(单位tick)",
        "placeholder": "默认为15"
      },
      {
        "type": "input",
        "text": "最高Y坐标",
        "placeholder": "默认为83"
      }
    ]
    }
    `;
    addForm(custom_form, function (...args) {
        executeCommand("/Set ATTACK_COUNT " + args[0]), executeCommand("/Set MAX_RANGE " + args[1]), executeCommand("/Set AUTO_INTERVAL " + args[2]), executeCommand("/Set POS_Y_MAX " + args[3]);
        clientMessage("攻击次数为" + args[0], "最大攻击距离为" + args[1], "自动攻击间隔为" + args[2], "最高Y坐标为" + args[3], "设置完毕");
    });
}

function onSendChatMessageEvent(message) {
    if (message.toLowerCase() === 'set') {
        InfiniteAuraSetting();
        return true; // 阻止消息继续传递
    } else
        return false; // 允许消息传递
}

clientMessage('§lRunAway > Load InfiniteAuraRIP §b✔');
clientMessage('§r§l项目地址：https://github.com/MoYuanCN/RIP-PrivateMod/');
loadScript("bhop.js");
clientMessage("基本信息显示仅在攻击时生效");

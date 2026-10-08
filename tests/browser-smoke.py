"""Run with browser-cdp-pw run < tests/browser-smoke.py; serve the repo on 3460.

The browser harness provides context and out. No product dependencies are needed.
"""
from pathlib import Path

base = 'http://127.0.0.1:3460'
artifacts = Path('/tmp/roll-it-review')
artifacts.mkdir(exist_ok=True)
p = context.new_page()
p.route('**/*', lambda route: route.continue_())
p.set_viewport_size({'width': 390, 'height': 844})
p.emulate_media(reduced_motion='reduce')
errors = []
p.on('pageerror', lambda error: errors.append(str(error)))
checks = 0


def check(value, label):
    global checks
    assert value, label
    checks += 1
    out('PASS ' + label)


def roll(button):
    p.locator(button).click()
    p.wait_for_function('(id) => !document.querySelector(id).disabled', arg=button)


p.goto(base + '/')
check(p.evaluate('''() => {
    const names = ['모', '도', '개', '걸', '윷'];
    for (let mask = 0; mask < 16; mask++) {
        const sticks = Array.from({length:4}, (_,i) => Boolean(mask & (1 << i)));
        const count = sticks.filter(Boolean).length;
        const result = resultForSticks(sticks);
        if (result.name !== (mask === 1 ? '빽도' : names[count])) return false;
        if (result.extra !== (count === 0 || count === 4)) return false;
    }
    return true;
}'''), 'All 16 yut outcomes and extra turns')
for _ in range(32):
    roll('#throw-btn')
check(p.locator('.history-item').count() == 30, 'Yut history bounded to 30')
check(p.locator('.hist-num').first.inner_text() == '32', 'Yut sequence retained')
p.goto(base + '/dice.html')
p.goto(base + '/')
check(p.locator('.history-item').count() == 30, 'Yut history survives navigation')
p.locator('#clear-btn').click()
p.reload()
check(p.locator('.history-item').count() == 0, 'Yut clear survives reload')

p.goto(base + '/dice.html')
p.locator('[data-count="2"]').click()
p.evaluate('Math.random = () => 0.999')
roll('#roll-btn')
check(p.locator('#result-name').inner_text() == '12', 'Two dice sum')
check(p.locator('#result-extra').evaluate("e => e.classList.contains('show')"), 'Double indicator')
check(p.locator('#die-1').get_attribute('aria-label') == '주사위 6', 'Accessible die value')
p.reload()
check(p.locator('.history-item').count() == 1, '2D history restored')
p.locator('[data-count="2"]').click()
p.emulate_media(reduced_motion='no-preference')
p.locator('#roll-btn').click()
check(p.locator('[data-count="1"]').is_disabled(), 'Selectors locked during roll')
check(p.locator('#clear-btn').is_disabled(), 'History clear locked during roll')
p.wait_for_function("!document.querySelector('#roll-btn').disabled")
p.emulate_media(reduced_motion='reduce')

p.goto(base + '/dice-3d/')
p.wait_for_function("!document.querySelector('#roll-btn').disabled", timeout=30000)
for sides in [6, 8, 12, 20]:
    p.locator(f'[data-sides="{sides}"]').click()
    p.locator('[data-count="4"]').click()
    roll('#roll-btn')
    values = p.locator('.history-item').first.locator('.mini-die').all_text_contents()
    check(len(values) == 4 and all(1 <= int(v) <= sides for v in values), f'Four D{sides} results in range')
    check(int(p.locator('#result-name').inner_text()) == sum(map(int, values)), f'D{sides} sum matches dice')
p.reload()
p.wait_for_function("!document.querySelector('#roll-btn').disabled")
check(p.locator('.history-item').count() == 4, '3D history restored')
p.emulate_media(reduced_motion='no-preference')
roll('#roll-btn')
check(p.locator('.history-item').count() == 5, 'Normal 3D animation resolves')
p.emulate_media(reduced_motion='reduce')

for route, name, button in [('/', 'yut', '#throw-btn'), ('/dice.html', 'dice', '#roll-btn'), ('/dice-3d/', '3d', '#roll-btn')]:
    p.goto(base + route)
    p.wait_for_function('(id) => !document.querySelector(id).disabled', arg=button)
    if name == '3d':
        p.locator('[data-count="4"]').click()
    elif name == 'dice':
        p.locator('[data-count="2"]').click()
    roll(button)
    for width, height, device in [(390, 844, 'phone'), (834, 1112, 'tablet'), (1194, 834, 'landscape'), (320, 740, 'small')]:
        p.set_viewport_size({'width': width, 'height': height})
        p.evaluate('scrollTo(0, 0)')
        p.evaluate('() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))')
        p.screenshot(path=str(artifacts / f'{name}-{device}.png'), full_page=True)
        check(p.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{name} {device} no horizontal overflow')
        check(p.locator(button).bounding_box()['height'] >= 44, f'{name} {device} touch target')
        if device in ['phone', 'small']:
            rect = p.locator(button).bounding_box()
            check(rect['y'] + rect['height'] <= height, f'{name} {device} action visible without scrolling')

check(not errors, 'No browser errors: ' + str(errors))
p.goto(base + '/dice.html')
p.evaluate("sessionStorage.setItem('roll-it:dice:v1', '[null,{\"values\":[999],\"num\":1}]')")
p.reload()
check(p.locator('.history-item').count() == 0, 'Invalid saved values rejected')
roll('#roll-btn')
check(p.locator('.history-item').count() == 1, 'Rolling works after invalid storage')
p.locator('#clear-btn').click()
p.reload()
check(p.locator('.history-item').count() == 0, '2D clear persists')

q = context.new_page()
q.add_init_script("Object.defineProperty(window, 'sessionStorage', {get() {throw new Error('blocked')}})")
q.goto(base + '/dice.html')
q.emulate_media(reduced_motion='reduce')
q.locator('#roll-btn').click()
q.wait_for_function("!document.querySelector('#roll-btn').disabled")
check(q.locator('.history-item').count() == 1, 'Storage denial does not prevent rolling')
check('유지할 수 없어요' in q.locator('#storage-note').inner_text(), 'Storage denial disclosed')
q.close()
p.goto(base + '/')
out(f'--- {checks} passed, 0 failed ---')

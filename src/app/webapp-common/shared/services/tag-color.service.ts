import {Injectable} from '@angular/core';
import {setTagColors, TagColor} from '../../core/actions/projects.actions';
import {Store} from '@ngrx/store';
import {selectTagColors, selectTagsColors} from '../../core/reducers/projects.reducer';
import {map} from 'rxjs/operators';
import {themeColor} from '../utils/theme-color';


@Injectable({
  providedIn: 'root'
})
export class TagColorService {
  public static predefined = [
    {foreground: 'white', background: 'var(--color-tag-1)'},
    {foreground: 'white', background: 'var(--color-tag-2)'},
    {foreground: 'white', background: 'var(--color-tag-3)'},
    {foreground: 'white', background: 'var(--color-tag-4)'},
    {foreground: 'white', background: 'var(--color-tag-5)'},
    {foreground: 'white', background: 'var(--color-tag-6)'},
    {foreground: 'white', background: 'var(--color-tag-7)'},
    {foreground: 'white', background: 'var(--color-tag-8)'},
    {foreground: 'white', background: 'var(--color-tag-9)'},
    {foreground: 'white', background: 'var(--color-tag-10)'},
    {foreground: 'white', background: 'var(--color-tag-11)'},
    {foreground: 'white', background: 'var(--color-tag-12)'},
    {foreground: 'white', background: 'var(--color-tag-13)'},
    {foreground: 'white', background: 'var(--color-tag-14)'},
    {foreground: 'white', background: 'var(--color-tag-15)'},
    {foreground: 'white', background: 'var(--color-tag-16)'},
    {foreground: 'white', background: 'var(--color-tag-17)'},
    {foreground: 'white', background: 'var(--color-tag-18)'},
    {foreground: 'white', background: 'var(--color-tag-19)'},
    {foreground: 'white', background: 'var(--color-tag-20)'},
  ] as TagColor[];

  private tagsColors: { [p: string]: TagColor };

  constructor(private store: Store) {
    store.select(selectTagsColors).subscribe(tagsColors => this.tagsColors = tagsColors);
  }

  getColor(tag: string) {
    return this.store.select(selectTagColors, {tag})
      .pipe(map(tagColor => tagColor ? tagColor : this.calcColor(tag) ));
  }

  calcColor(tag: string): TagColor {
    const sum = Array.from(tag)
      .map(chr => chr.charCodeAt(0))
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    return TagColorService.resolve(TagColorService.predefined[sum % 20]);
  }

  // Predefined colours are tokens; consumers such as colour pickers need the value.
  static resolve(color: TagColor): TagColor {
    return {...color, background: themeColor(color.background as string)} as TagColor;
  }

  setColor(tag: string, colors: Partial<TagColor>) {
    if (!colors.background || !colors.foreground) {
      const curr = this.tagsColors[tag] || this.calcColor(tag);
      this.store.dispatch(setTagColors({tag, colors: {
        background: colors.background || curr.background,
        foreground: colors.foreground || curr.foreground
      }}));
    } else {
      this.store.dispatch(setTagColors({tag, colors: colors as TagColor}));
    }
  }
}

